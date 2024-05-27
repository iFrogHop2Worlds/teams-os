use std::sync::{Arc, Mutex};
use bson::doc;
use mongodb::results::InsertOneResult;
pub use rocket::response::stream::{EventStream, Event};
pub use rocket::{State, Shutdown, delete, post, get, put};
use rocket::http::Status;
use rocket::serde::Deserialize;
use rocket::serde::json::Json;
use crate::chat::{ChatState, Message, Room};
pub use rocket::tokio::sync::broadcast::{channel, Sender, error::RecvError};
pub use rocket::tokio::select;
use crate::chat_state_dao::MongoDB;

#[get("/events")]
pub async fn events(queue: &State<Sender<Message>>, mut end: Shutdown) -> EventStream![] {
    let mut rx = queue.subscribe();
    EventStream! {
        loop {
            let msg = select! {
                msg = rx.recv() => match msg {
                    Ok(msg) => msg,
                    Err(RecvError::Closed) => break,
                    Err(RecvError::Lagged(_)) => continue,
                },
                _ = &mut end => break,
            };

            yield Event::json(&msg);
        }
    }
}
/// Returns an infinite stream of server-sent events. Each event is a State Object
/// pulled from a broadcast queue sent by the `post` handler.
#[get("/chat_state/events")]
pub fn get_chat_state(chat_state_tx: &State<Sender<ChatState>>, mut end: Shutdown) -> EventStream![] {
    let mut rx = chat_state_tx.subscribe();
    EventStream! {
        loop {
            let chat_state = select! {
                chat_state = rx.recv() => match chat_state {
                    Ok(chat_state) => chat_state,
                    Err(RecvError::Closed) => break,
                    Err(RecvError::Lagged(_)) => continue,
                },
                _ = &mut end => break,
            };

            yield Event::json(&chat_state);
        }
    }
}

/// Receive a message from a form submission
/// Update App State
/// and broadcast to receivers.
#[post("/message", data = "<json>")]
pub fn post(json: Json<Message>, state: &State<Arc<Mutex<ChatState>>>, chat_state_tx: &State<Sender<ChatState>>) {
    let mut chat_state = state.lock().unwrap();

    if let Some(room_index) = chat_state.rooms.iter().position(|room| room.room == json.room) {
        let mut room = chat_state.rooms.remove(room_index);
        room.messages.push(json.clone().into_inner());
        chat_state.rooms.push(room); // Insert the updated room at the end
    } else {
        println!("Room does not exist");
    }

    let _res = chat_state_tx.send(chat_state.clone());
}

#[get("/rooms/<room_name>/messages")]
pub fn get_room_messages(room_name: &str, state: &State<Arc<Mutex<ChatState>>>) -> Option<Json<Vec<Message>>> {
    let chat_state = state.inner().lock().unwrap();
    println!("Requested room name: {}", room_name);
    let messages = chat_state.get_room_messages(room_name);
    println!("Messages: {:?}", &messages);
    messages.map(|messages| Json(messages.to_vec()))
}

#[derive(Deserialize)]
struct CreateRoomData {
    name: String,
}
#[post("/create_room", data = "<room_data>")]
pub fn create_new_room(room_data: Json<CreateRoomData>, state: &State<Arc<Mutex<ChatState>>>, chat_state_tx: &State<Sender<ChatState>>) -> Option<Json<Room>>    {
    let mut chat_state = state.lock().unwrap();

    if chat_state.rooms.iter().any(|room| room.room == room_data.name) {
        println!("Room with name '{}' already exists", room_data.name);
        return None;
    }

    let new_room = Room {
        room: room_data.name.clone(),
        messages: Vec::new(),
    };
    chat_state.rooms.push(new_room.clone());
    let _res = chat_state_tx.send(chat_state.clone());
    Some(Json(new_room))
}

#[derive(Deserialize)]
struct UpdateRoom {
    old_name: String,
    new_name: String,
}
#[post("/update_room", data = "<room_data>")]
pub fn update_room(room_data: Json<UpdateRoom>, state: &State<Arc<Mutex<ChatState>>>, chat_state_tx: &State<Sender<ChatState>>) -> Option<Json<Room>> {
    let mut chat_state = state.lock().unwrap();

    let room_index = chat_state.rooms.iter().position(|room| room.room == room_data.old_name);

    match room_index {
        Some(index) => {
            let mut room = chat_state.rooms.remove(index);
            room.room = room_data.new_name.clone();
            chat_state.rooms.push(room.clone());

            println!("Room '{}' updated to '{}' successfully", room_data.old_name, room_data.new_name);

            let _res = chat_state_tx.send(chat_state.clone()); // Broadcast updated state
            Some(Json(room))
        },
        None => {
            println!("Room with name '{}' not found", room_data.old_name);
            None
        }
    }
}


#[delete("/delete_room/<room_name>")]
pub fn delete_room(room_name: String, state: &State<Arc<Mutex<ChatState>>>, chat_state_tx: &State<Sender<ChatState>>) -> Option<Json<()>> {
    let mut chat_state = state.lock().unwrap();

    // Find the index of the room to delete
    let room_index = chat_state.rooms.iter().position(|room| room.room == room_name);

    match room_index {
        Some(index) => {
            chat_state.rooms.remove(index);
            println!("Room '{}' deleted successfully", room_name);

            let _res = chat_state_tx.send(chat_state.clone()); // Broadcast updated state
            Some(Json(()))
        },
        None => {
            println!("Room with name '{}' not found", room_name);
            None
        }
    }
}

/// Seed the front end client on first load.
#[get("/seed")]
pub fn seed(state: &State<Arc<Mutex<ChatState>>>) -> Option<Json<Vec<Room>>> {
    let chat_state = state.lock().unwrap();
    Some(Json(chat_state.rooms.clone()))
}

//testing chatstate dao
#[get("/test/save")]
pub async fn save_state_db( db: &State<MongoDB>, state: &State<Arc<Mutex<ChatState>>>) -> Result<Json<InsertOneResult>, Status> {
    let data = state.lock().unwrap().clone();

    let saved_chat = db.save_new(data);

    match saved_chat {
        Ok(user) => Ok(Json(user)),
        Err(_) => Err(Status::InternalServerError),
    }
}

#[get("/test/get/<path>")]
pub async fn get_state_db( db: &State<MongoDB>, path: String) -> Result<Json<ChatState>, Status> {
    let id = path;
    if id.is_empty() {
        return Err(Status::BadRequest);
    };
    let chat_state = db.get_saved_chats(&id);

    match chat_state {
        Ok(chats) => Ok(Json(chats)),
        Err(_) => Err(Status::InternalServerError),
    }
}

#[put("/test/update/<path>")]
pub async fn update_state_db( db: &State<MongoDB>, state: &State<Arc<Mutex<ChatState>>>, path: String) -> Result<Json<ChatState>, Status> {
    let id = path;
    if id.is_empty() {
        return Err(Status::BadRequest);
    };

    let chat_state = state.lock().unwrap().clone();
    let update_result = db.update_saved_chats(&id, chat_state);

    match update_result {
        Ok(update) => {
            return if update.matched_count == 1 {
                let updated_chat_info = db.get_saved_chats(&id);
                match updated_chat_info {
                    Ok(chat) => Ok(Json(chat)),
                    Err(_) => Err(Status::InternalServerError),
                }
            } else {
                Err(Status::NotFound)
            }
        }
        Err(_) => Err(Status::InternalServerError),
    }
}

