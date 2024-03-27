use bson::{Bson, doc, document};
use rocket::FromForm;
use rocket::serde::{Deserialize, Serialize};
use mongodb::bson::oid::ObjectId;
use crate::chat;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatState {
    pub _id: ObjectId,
    pub rooms: Vec<Room>,
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

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Room {
    pub room: String,
    pub messages: Vec<Message>,
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

impl From<ChatState> for Bson {
    fn from(chat_state: ChatState) -> Self {
        let doc = doc! {
            "_id": chat_state._id,
            "rooms": chat_state.rooms.iter().map(|value: &Room| Room::from(value.clone())).collect::<Vec<_>>()
        };
        Bson::Document(doc)
    }
}

impl From<Room> for Bson {
    fn from(room: Room) -> Self {
        let doc = doc! {
            "room": room.room,
            "messages": room.messages.iter().map(|value: &Message| Message::from(value.clone())).collect::<Vec<_>>()
        };
        Bson::Document(doc)
    }
}

impl From<Message> for Bson {
    fn from(message: Message) -> Self {
        let doc = doc! {
            "room": message.room,
            "username": message.username,
            "message": message.message
        };
        Bson::Document(doc)
    }
}

pub fn to_bson_doc(chat_state: &ChatState) -> Bson {
    chat_state.clone().into()
}