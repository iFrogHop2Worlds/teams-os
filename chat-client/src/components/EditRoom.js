import React, {useState} from 'react'


export default function EditRoom({dispatch, roomId, toggleEditGroup}) {
    const [deleteRoom, setDeleteRoom] = useState('');

    const deletRoomHandler = (e) => {
        e.preventDefault();

        fetch(process.env.NEXT_PUBLIC_API_BASE_URL + '/delete_room/' + deleteRoom, { method: 'DELETE' })
        dispatch({type: "DEL_ROOM", payload: deleteRoom});
        toggleEditGroup(roomId);
        setDeleteRoom('');
    }

    return (
    <div className='bg-slate-800 bg-opacity-20 p-3 z-30 '>
    <form className='flex-col justify-evenly'>
        <input className=' w-5/6 m-2 p-3' type="text" value={deleteRoom} onChange={(e) => setDeleteRoom(e.target.value)} placeholder="new name" />
        <button className='text-white p-5 m-2 bg-cyan-900 rounded-md text-sm' onClick={(e) => deletRoomHandler(e)}>Change Name</button>

        <input className=' w-5/6 m-2 p-3' type="text" value={deleteRoom} onChange={(e) => setDeleteRoom(e.target.value)} placeholder="room name" />
        <button className='text-white p-5 m-2 bg-red-600 rounded-md text-sm' onClick={(e) => deletRoomHandler(e)}>Delete</button>
    </form> 
    </div>
    )
}
