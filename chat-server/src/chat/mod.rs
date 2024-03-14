use rocket::serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize)]
pub struct ChatState {
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