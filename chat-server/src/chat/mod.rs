use bson::{doc, document};
use rocket::FromForm;
use rocket::serde::{Deserialize, Serialize};
use mongodb::bson::oid::ObjectId;
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatState {
    pub _id: ObjectId,
    pub rooms: Vec<Room>,
}

#[derive(Serialize, Debug, Clone)]
pub struct Room {
    pub room: String,
    pub messages: Vec<Message>,
}

impl ChatState {
    pub fn get_room_messages(&self, room_name: &str) -> Option<&Vec<Message>> {
        self.rooms.iter()
            .find(|room| room.room == room_name)
            .map(|room| &room.messages)
    }

    pub fn update_room(&mut self, room_name: &str) -> bool {
       // self.room
        true
    }
}


#[derive(Debug, Clone, FromForm, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, UriDisplayQuery))]
#[serde(crate = "rocket::serde")]
pub struct Message {
    #[field(validate = len(..30))]
    pub room: String,
    #[field(validate = len(..20))]
    pub username: String,
    pub message: String,
}
