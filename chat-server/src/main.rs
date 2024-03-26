#[macro_use] extern crate rocket;

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
        message_api::test
    ]
}

#[rocket::main]
async fn main() -> Result<(), Box<dyn Error>> {
    let db = MongoDB::init();

    let chat_state = Arc::new(Mutex::new(ChatState {
        _id: ObjectId::new(),
        rooms: vec![Room{room: "lobby".to_string(), messages: Vec::new()}],
    }));

    let allowed_origins = AllowedOrigins::all();

    let cors = rocket_cors::CorsOptions {
        allowed_origins,
        allowed_methods: vec![Method::Get, Method::Post, Method::Delete].into_iter().map(From::from).collect(),
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