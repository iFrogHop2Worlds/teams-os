#[macro_use]
extern crate rocket;
use std::fmt::Debug;
use tokio::time::{Instant, interval_at};
use bson::oid::ObjectId;
use chrono::Local;
use crate::chat_state_dao::MongoDB;
pub mod lib;
use lib::*;
use crate::lib::chat::ChatState;

pub fn all() -> Vec<rocket::Route> {
    routes![
        create_new_room,
        update_room,
        delete_room,
        events,
        post,
        get_room_messages,
        get_chat_state,
        seed,
        save_state_db,
        get_state_db,
        update_state_db
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

    tokio::spawn( async move {
        let db = MongoDB::init();
        let start = Instant::now();
        let mut interval = interval_at(start, tokio::time::Duration::from_secs(720));

        loop {
            interval.tick().await;
            println!("updating db seed @ {:?}", Local::now());
                let mut state = _chat_state.lock().unwrap();
                let update_result = db.update_saved_chats(&"66024ff5f8d1374a8b694a8d".to_string(), state.clone());
                match update_result {
                    Ok(update) => {
                        if update.matched_count != 1 {
                            eprintln!("Error updating chat state: Document not found");
                        }
                    }
                    Err(_) => eprintln!("Error updating chat state"),
                }
        }
    });


    let allowed_origins = AllowedOrigins::all();

    let cors = CorsOptions {
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