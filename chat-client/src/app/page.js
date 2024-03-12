'use client'
import React, { useState, useEffect, useRef } from 'react';

function Chat() {
    const [connectedStatus, setConnectedStatus] = useState(false);
    const [retryTime, setRetryTime] = useState(1);
    const eventsRef = useRef(null);
    const [username, setUsername] = useState('Guest');
    const [message, setMessage] = useState('');
    const [newRoom, setNewRoom] = useState('');
    // STate should be seeded with up to date records on first load. This will happen when we save chats to server state or db
    const [state, setState] = useState({
        room: "lobby",
        rooms: [{ name: "lobby", messages: [] }],
        connected: false,
    });
   
    const connect = () => {
        const eventSource = new EventSource('http://127.0.0.1:8000/events');
   
        eventSource.onmessage = (event) => {
            let newMessage;
            try {
                newMessage = JSON.parse(event.data);
              
                const updatedRoom = state.rooms.find(room => room.name === newMessage.room);
            
                if (updatedRoom) {
                    const setStates = (update) => setState({ ...state, ...update });

                    setStates({
                        rooms: state.rooms.map((room) =>
                            room.name === newMessage.room ? { ...room, messages: [...room.messages, newMessage] } : room
                        ),
                    });
                }
            } catch (error) {
                console.log(error);
            }
        };

        eventSource.onopen = () => {
            setConnectedStatus(true);
            setRetryTime(1);
        };
    
        eventSource.onerror = () => {
            setConnectedStatus(false);
            eventSource.close();
            const timeout = Math.min(64, retryTime * 2);
            setRetryTime(timeout);
            setTimeout(connect, timeout * 1000);
        };
    
        eventsRef.current = eventSource;
    }

    useEffect(() => {
        connect()
    }, []);

    const hashColor = (str) => {
        // Your hashColor function implementation here
    };

    const addRoom = (e) => {
        e.preventDefault();

        if (state.rooms.find(room => room.name === newRoom)) {
        changeRoom(newRoom);
        return false;
        }

        const newRooms = [...state.rooms, { name: newRoom, messages: [] }];
        setState({ ...state, rooms: newRooms });
        changeRoom(newRoom);
        return true;
    };

    const changeRoom = (e) => {
        const name = e.target.accessKey || e.target.name;
        if (state.room === name) return;
        setState({ ...state, room: name });
        eventsRef.current.close()
        connect()
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (message !== '') {
            fetch('http://127.0.0.1:8000/message', {
                method: 'POST',
                body: JSON.stringify({ room: state.room, username, message }),
            })
        }
    };

    return (
        <div className='grid md:grid-cols-6 bg-slate-700 m-1 rounded-lg bg-opacity-80 absolute overflow-auto h-full '>
        {/* Left column (hidden on mobile) */}
        <div className='md:col-start-1 md:col-span-1 h-100% border-r border-black p-2 m-6 hidden md:grid overflow-y-scroll w-fit'>
            <div>
                <p className='text-white font-thin text-4xl mb-4'>Byrne Creek Bros</p>
                <p className='text-white font-thin text-4xl mb-4'>chat server</p> {state.rooms.length}
                <hr />
            </div>

            <div className='grid '>
                {state.rooms.map((room) => (
                    <button onClick={changeRoom} className='bg-black text-white text-left rounded-md m-2 p-4 w-full line-clamp-3 h-fit -translate-x-6' accessKey={room.name}>
                        <p className='grid font-semibold text-md' accessKey={room.name}>{room.name}</p>
                        <p className='text-sm' accessKey={room.name}>{room.messages[room.messages.length-1]?.username + " " + room.messages[room.messages.length-1]?.message}</p>
                    </button>
                ))}
            </div>
            <form id="new-room" className='flex place-self-end justify-start w-full h-12 pr-8'>
                <input type="text" name="name" id="name" autocomplete="off"
                    placeholder="new room..." maxlength="29" value={newRoom} onChange={(e) => setNewRoom(e.target.value)}></input>
                <button onClick={(e) => addRoom(e)} className='bg-green-300 w-full h-full p-2 ml-1 -mr-3'>+</button>
            </form>
        </div>

        {/* Right column */}
        <div className='md:col-start-2 md:col-span-4 mb-32 md:ml-32 md:-mr-32 md:pl-12'>
            <div className='flex justify-between'>
                <p>{state.room}</p>
                <div>
                Set username
                <input type="text" name="name" id="name" autocomplete="off"
                        placeholder="new room..." maxlength="29" value={username} onChange={(e) => setUsername(e.target.value)}></input>
                </div>
            </div>
            <div className='grid h-full place-content-end justify-start'>
                <ul className='text-white h-full overflow-y-auto'>
                    {state.rooms.find(room => room.name === state.room)?.messages.map((message) => (
                        <li key={message.id}>
                            <b>{message.username}</b>: {message.message}
                        </li>
                    ))}
                </ul>
            </div>

            <div className='flex w-full'>
                <form className='flex mb-2 w-full '>
                    <input className='text-black w-full m-2' type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Message" />
                    <button className='p-5 m-2 text-white bg-slate-900 rounded-md text-sm' onClick={(e) => handleSendMessage(e)}>Send</button>
                </form>
            </div>
        </div>
    </div>   
    );
}

export default Chat;

