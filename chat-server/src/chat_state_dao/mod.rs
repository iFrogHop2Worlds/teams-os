use std::env;
extern crate dotenv;
use dotenv::dotenv;
use mongodb::{bson::{doc, extjson::de::Error, oid::ObjectId}, sync::{Client, Collection}, results::{InsertOneResult, UpdateResult, DeleteResult}};
use rocket::serde::{Deserialize, Serialize};
use crate::chat::ChatState;

pub struct MongoDB {
    pub(crate) col: Collection<ChatState>,
}

impl MongoDB {
    pub fn init() -> Self {
        dotenv().ok();
        let uri = match env::var("MONGO_DB_URL") {
            Ok(v) => v.to_string(),
            Err(_) => "Error loading env variable".to_string(),
        };
        let client = Client::with_uri_str(uri).unwrap();
        let db = client.database("friends-os");
        let col: Collection<ChatState> = db.collection("GroupChats");
        MongoDB { col }
    }

    pub fn save_new(&self, new: ChatState) -> Result<InsertOneResult, Error> {
        let new_doc = ChatState {
            _id: ObjectId::new(),
            rooms: new.rooms
        };
        let chat_state = self
            .col
            .insert_one(new_doc, None)
            .ok()
            .expect("Error saving state");

        Ok(chat_state)
    }

    pub fn get_saved_chats(&self, id: &String) -> Result<ChatState, Error> {
        let obj_id = ObjectId::parse_str(id).unwrap();
        let filter = doc! {"_id": obj_id};
        let chat_state = self
            .col
            .find_one(filter, None)
            .ok()
            .expect("Error getting chat detail");
        Ok(chat_state.unwrap())
    }

    pub fn update_saved_chats(&self, id: &String, new: ChatState) -> Result<UpdateResult, Error> {
        let obj_id = ObjectId::parse_str(id).unwrap();
        let filter = doc! {"_id": obj_id};
        let new_doc = doc! {
            "$set":
                {
                    "id": new._id,
                    "rooms": new.rooms
                },
        };
        let updated_doc = self
            .col
            .update_one(filter, new_doc, None)
            .ok()
            .expect("Error updating chat state");
        Ok(updated_doc)
    }

    pub fn delete_chat_save_state(&self, id: &String) -> Result<DeleteResult, Error> {
        let obj_id = ObjectId::parse_str(id).unwrap();
        let filter = doc! {"_id": obj_id};
        let chat_state = self
            .col
            .delete_one(filter, None)
            .ok()
            .expect("Error deleting saved state");

        Ok(chat_state)
    }
    /// returns all saved states. Maybe used to do rollbacks,
    pub fn get_archives(&self) -> Result<Vec<ChatState>, Error> {
        let cursors = self
            .col
            .find(None, None)
            .ok()
            .expect("Error getting chat state logs");
        let saved_states = cursors.map(|doc| doc.unwrap()).collect();

        Ok(saved_states)
    }
}

