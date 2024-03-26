import React, { useState, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { ChatStore } from '@/utils/chatStore';
import EditRoom from './EditRoom';

export default function RoomList() {
  const [editRoomIds, setEditRoomIds] = useState({}); // Track edit state for each room
  const [newRoom, setNewRoom] = useState('');
  const { chat_state, dispatch } = useContext(ChatStore);
  const {currRoom, rooms } = chat_state;
  const router = useRouter();

  const toggleEditGroup = (roomId) => {
    setEditRoomIds((prevEditRoomIds) => ({
      ...prevEditRoomIds,
      [roomId]: !prevEditRoomIds[roomId], 
    }));
  };

  const addRoom = (e) => {
    e.preventDefault();
    if(newRoom != '' && newRoom != undefined){
        if (rooms.find(room => room.name === newRoom)) {
            changeRoom(newRoom);
            return false;
        }
        fetch(process.env.NEXT_PUBLIC_API_BASE_URL + '/create_room', {
            method: 'POST',
            body: JSON.stringify({ name: newRoom }),
        })

        dispatch({ type: 'ADD_ROOM', payload: newRoom });  
        changeRoom(newRoom);
        return true;
    }
};
const changeRoom = (name) => {  
  //if (chat_state.currRoom === name) return;
  dispatch({ type: 'SET_CURRENT_ROOM', payload: name });
  setNewRoom('');
};

const changeRoomOnClickHandler = (e) => {
  e.preventDefault();
  const name =  e.target.name;
  if (chat_state.currRoom === name) return;
  dispatch({ type: 'SET_CURRENT_ROOM', payload: name });
  router.push('/')
};
 
  return (
    <>
      <div className="mb-4 font-thin text-white">
        <p className="text-gray-500 text-4xl mb-4">{process.env.NEXT_PUBLIC_SERVER_NAME}</p>
        <p className="text-orange-400 text-4xl mb-4">chat server</p>
        {rooms.length} chat rooms
      </div>
      <div className="h-[calc(100vh - 30vh)] w-fit overscroll-x-none overflow-y-scroll mb-8">
        <div className="flex flex-col-reverse">
          {rooms?.map((room) => (
            
            <div key={room.room} className="mb-2">
              <p
                className={`text-4xl relative text-white  font-extrabold p-1 mb-4  w-12 h-12 z-50 translate-y-12 cursor-pointer `}
                onClick={() => toggleEditGroup(room.room)}
              >
                <em className=''>...</em>
              </p>
              {editRoomIds[room.room] && <EditRoom dispatch={dispatch} roomId={room.room} toggleEditGroup={toggleEditGroup } />}
              <button
                key={room.room}
                onClick={changeRoomOnClickHandler}
                className={`bg-black text-white w-full text-left rounded-md m-1 p-6   z-40 overscroll-x-none overflow-hidden ${
                  currRoom === room.room ? 'border border-cyan-400' : ''
                }`}
                name={room.room}
                accessKey={room.room}
              >
                {`[${room.room}] ${
                  room.messages[room.messages.length - 1]?.username
                    ? room.messages[room.messages.length - 1].username
                    : ''
                } : ${
                  room.messages[room.messages.length - 1]?.message !== undefined
                    ? room.messages[room.messages.length - 1]?.message
                    : ''
                }`}
              </button>
            </div>
          ))}
        </div>
      </div>
      <form
        id="new-room"
        className="flex place-self-end justify-start h-12 mb-8 pr-12 pl-4"
      >
        <input
          type="text"
          name="name"
          id="name"
          autoComplete="off"
          placeholder="new room..."
          maxLength="29"
          value={newRoom}
          onChange={(e) => setNewRoom(e.target.value)}
        />
        <button onClick={(e) => addRoom(e)} className="bg-emerald-600 w-full h-full p-2 ml-1 -mr-3">
          +
        </button>
      </form>
    </>
  );
}
