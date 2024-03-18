import React, { createContext, useReducer } from 'react';

const initialState = {
    currRoom: 'nullRoom',
    rooms: [{ name: 'nullRoom', messages: [{username:"Friends-os", message: "Create or join a room to send a message"}] }],
    connected: false,
};

const reducer = (chat_state, action) => {

    switch(action.type) {

        case 'ADD_ROOM' : {
            const newRooms = [...chat_state.rooms, { name: action.payload, messages: [] }];
            return { ...chat_state, rooms: newRooms };
        }

        case 'DEL_ROOM': {
            const newRooms = chat_state.rooms.filter(room => room.name !== action.payload);
            return { ...chat_state, rooms: newRooms };
        }

        case 'SET_CURRENT_ROOM' : return { ...chat_state, currRoom: action.payload }
        

        case 'SYNC_SERVER_STATE' : return { ...chat_state, rooms: action.payload };
        
        default: return chat_state;
    }
};

export const ChatStore = createContext();

export const ChatStoreProvider = ({ children }) => {
  const [chat_state, dispatch] = useReducer(reducer, initialState);
  const value = { chat_state, dispatch };
  return <ChatStore.Provider value={value}>{children}</ChatStore.Provider>;
};
