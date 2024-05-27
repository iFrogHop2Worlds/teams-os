#[macro_use]
extern crate rocket;
use std::thread;
use tokio::time::{sleep, Duration, Instant, interval_at};
use bson::oid::ObjectId;
use crate::chat_state_dao::MongoDB;
use rocket::State;
pub mod lib;
use lib::*;
use crate::lib::chat::ChatState;

pub fn all() -> Vec<rocket::Route> {
    routes![
        message_api::create_new_room,
        message_api::update_room,
        message_api::delete_room,
        message_api::events,
        message_api::post,
        message_api::get_room_messages,
        message_api::get_chat_state,
        message_api::seed,
        message_api::save_state_db,
        message_api::get_state_db,
        message_api::update_state_db
    ]
}

#[rocket::main]
async fn main() -> Result<(), Box<dyn Error>> {
    let db = MongoDB::init();

    let mut chat_state = db.get_saved_chats(&"66024ff5f8d1374a8b694a8d".to_string()).unwrap_or_else(|_| {
        eprintln!("Error fetching chat state from database, using default");
        ChatState {
            _id: ObjectId::new(),
            rooms: vec![Room {
                room: "lobby".to_string(),
                messages: Vec::new(),
            }],
        }
    });

    let chat_state = Arc::new(Mutex::new(chat_state));
    let _chat_state = chat_state.clone();

    tokio::spawn(async move {
        let db = MongoDB::init();
        let start = Instant::now();
        let mut interval = interval_at(start, tokio::time::Duration::from_secs(720));

        loop {
            interval.tick().await;
            println!("Trying to update");
                let mut state = _chat_state.lock().unwrap();
                let update_result = db.update_saved_chats(&"66024ff5f8d1374a8b694a8d".to_string(), state.clone());
                match &update_result {
                    Ok(update) => {
                        println!("update result: {:?}", update_result );
                        if update.matched_count != 1 {
                            eprintln!("Error updating chat state: Document not found");
                        }
                    }
                    Err(_) => eprintln!("Error updating chat state"),
                }
        }
    });


    let allowed_origins = AllowedOrigins::all();

    let cors = rocket_cors::CorsOptions {
        allowed_origins,
        allowed_methods: vec![Method::Get, Method::Post, Method::Delete, Method::Put].into_iter().map(From::from).collect(),
        allowed_headers: AllowedHeaders::some(&["Authorization", "Accept"]),
        allow_credentials: true,
        ..Default::default()
    }
        .to_cors()?;

    let _ = rocket::build()
        .manage(chat_state.clone())
        .manage(db)
        .manage(channel::<Message>(1024).0)
        .manage(channel::<ChatState>(1024).0)
        .mount("/", all())
        .attach(cors)
        .launch()
        .await?;

    Ok(())
}