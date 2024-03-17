import React, { useState } from 'react';
import EditRoom from './EditRoom';

//2do 
export default function RoomList({
  numberOfRooms,
  rooms,
  currRoom,
  newRoom,
  setNewRoom,
  addRoom,
  changeRoomOnClickHandler,
}) {
  const [editRoomIds, setEditRoomIds] = useState({}); // Track edit state for each room

  const toggleEditGroup = (roomId) => {
    setEditRoomIds((prevEditRoomIds) => ({
      ...prevEditRoomIds,
      [roomId]: !prevEditRoomIds[roomId], // Toggle edit state for the clicked room
    }));
  };

  return (
    <>
      <div className="mb-4 font-thin text-white">
        <p className="text-gray-500 text-4xl mb-4">{process.env.NEXT_PUBLIC_SERVER_NAME}</p>
        <p className="text-orange-400 text-4xl mb-4">chat server</p>
        {numberOfRooms} chat rooms
      </div>
      <div className="h-[calc(100vh - 30vh)] w-fit overscroll-x-none overflow-y-scroll mb-8">
        <div className="flex flex-col-reverse">
          {rooms?.map((room) => (
            <div key={room.room} className="mb-2">
              <p
                className={`text-xl text-white  font-extrabold p-1 mb-4 mr-4 float-right -translate-y-24 z-50 cursor-pointer `}
                onClick={() => toggleEditGroup(room.room)}
              >
                <em className='absolute z-50'>...</em>
              </p>
              {editRoomIds[room.room] && <EditRoom />}
              <button
                key={room.room}
                onClick={changeRoomOnClickHandler}
                className={`bg-black text-white w-full text-left rounded-md m-1 p-6  z-40 overscroll-x-none overflow-hidden ${
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
