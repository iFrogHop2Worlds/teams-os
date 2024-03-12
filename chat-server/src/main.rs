#[macro_use] extern crate rocket;
use rocket::{State, Shutdown};
use rocket::form::Form;
use rocket::response::stream::{EventStream, Event};
use rocket::serde::{Serialize, Deserialize};
use rocket::tokio::sync::broadcast::{channel, Sender, error::RecvError};
use rocket::tokio::select;
use rocket::http::Method;
use rocket_cors::{AllowedOrigins, CorsOptions};
use rocket::{get, post, routes};
use rocket_cors::{AllowedHeaders};
use std::error::Error;
use rocket::serde::json::Json;
use std::sync::{Arc, Mutex};

// 2do
// update app state from the event stream/main? (construct app state) vs doing it on the f.e
// send app_state to db periodically
// seed app state from db when server starts
#[derive(Debug)]
struct ChatState {
    rooms: Vec<Room>,
}

#[derive(Debug)]
struct Room {
    name: String,
    messages: Vec<Message>,
}

impl ChatState {
    fn get_room_messages(&self, room_name: &str) -> Option<&Vec<Message>> {
        self.rooms.iter()
            .find(|room| room.name == room_name)
            .map(|room| &room.messages)
    }
}


#[derive(Debug, Clone, FromForm, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, UriDisplayQuery))]
#[serde(crate = "rocket::serde")]
struct Message {
    #[field(validate = len(..30))]
    pub room: String,
    #[field(validate = len(..20))]
    pub username: String,
    pub message: String,
}

/// Returns an infinite stream of server-sent events. Each event is a message
/// pulled from a broadcast queue sent by the `post` handler.
#[get("/events")]
async fn events(queue: &State<Sender<Message>>, mut end: Shutdown) -> EventStream![] {
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

/// Receive a message from a form submission and broadcast it to any receivers.
/// Update App State
#[post("/message", data = "<json>")]
fn post(json: Json<Message>, queue: &State<Sender<Message>>, state: &State<Arc<Mutex<ChatState>>>){
    let mut chat_state = state.lock().unwrap();

    if let Some(mut room) = chat_state.rooms.iter_mut().find(|room| room.name == json.room) {
        // Add the message to the room's messages vector
        room.messages.push(json.clone().into_inner());
    } else {
        // Handle room not found scenario (e.g., error message)
        println!("Room does not exist");
    }
    // if json.name === chat_state.rooms.*.name then append messages
    println!("json message in send: {:?}", chat_state.rooms);
    // A send 'fails' if there are no active subscribers. That's okay.
    let _res = queue.send(json.into_inner());
}

#[get("/rooms/<room_name>/messages")]
fn get_room_messages(room_name: &str, state: &State<Arc<Mutex<ChatState>>>) -> Option<Json<Vec<Message>>> {
    let chat_state = state.inner().lock().unwrap();
    println!("Requested room name: {}", room_name);
    let messages = chat_state.get_room_messages(room_name);
    println!("Messages: {:?}", &messages);
    messages.map(|messages| Json(messages.to_vec()))
}

#[rocket::main]
async fn main() -> Result<(), Box<dyn Error>> {

    let chat_state = Arc::new(Mutex::new(ChatState {
        rooms: vec![Room{name: "lobby".to_string(), messages: Vec::new()}],
    }));

    let allowed_origins = AllowedOrigins::all();

    let cors = rocket_cors::CorsOptions {
        allowed_origins,
        allowed_methods: vec![Method::Get, Method::Post].into_iter().map(From::from).collect(),
        allowed_headers: AllowedHeaders::some(&["Authorization", "Accept"]),
        allow_credentials: true,
        ..Default::default()
    }
        .to_cors()?;

    let _ = rocket::build()
        .manage(chat_state.clone())
        .manage(channel::<Message>(1024).0)
        .mount("/", routes![post, events, get_room_messages])
        .attach(cors)
        .launch()
        .await?;

    Ok(())
}