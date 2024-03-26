import React, {useState} from 'react'


export default function EditRoom({dispatch, roomId, toggleEditGroup}) {
    const [deleteRoom, setDeleteRoom] = useState('');
    const [newRoomName, setNewRoomName] = useState('');

    const deletRoomHandler = (e) => {
        e.preventDefault();
        fetch(process.env.NEXT_PUBLIC_API_BASE_URL + '/delete_room/' + deleteRoom, { method: 'DELETE' })
        dispatch({type: "DEL_ROOM", payload: deleteRoom});
        toggleEditGroup(roomId);
        setDeleteRoom('');
    }

    const updateRoomHandler = (e) => {
        e.preventDefault();
        console.log(roomId)
        fetch(process.env.NEXT_PUBLIC_API_BASE_URL + '/update_room', { 
            method: 'POST',
            body: JSON.stringify({ old_name: roomId, new_name: newRoomName }),
        })
        toggleEditGroup(roomId);
        setNewRoomName('');
    }

    return (
    <div className='bg-black p-4 border-l-2 border-cyan-300 translate-y-2 translate-x-1 rounded-t-lg  '>
    <form className='grid '>
        <div className='flex justify-between'>
            <input className='m-2 p-3' type="text" value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} placeholder="new name" />
            <button className='text-white  bg-cyan-900 rounded-md m-2 p-2' onClick={(e) => updateRoomHandler(e)}>Update</button>
        </div>

        <div className='flex justify-between'>
            <input className='m-2 p-3' type="text" value={deleteRoom} onChange={(e) => setDeleteRoom(e.target.value)} placeholder="room name" />
            <button className='text-white  bg-red-600 rounded-md m-2 p-2' onClick={(e) => deletRoomHandler(e)}>Delete</button>
        </div>
    </form> 
    </div>
    )
}
