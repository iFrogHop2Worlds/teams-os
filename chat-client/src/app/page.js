'use client'
import React, { useState, useEffect, useRef } from 'react';

function Chat() {
    const [connectedStatus, setConnectedStatus] = useState(false);
    const [retryTime, setRetryTime] = useState(1);
    const [retryStateTime, setRetryStateTime] = useState(1);
    const eventsRef = useRef(null);
    const stateRef = useRef(null);
    const [username, setUsername] = useState('Guest');
    const [message, setMessage] = useState('');
    const [newRoom, setNewRoom] = useState('');
    const [state, setState] = useState({
        room: "lobby",
        rooms: [{ name: "lobby", messages: [] }],
        connected: false,
    });
   
    const connect = () => {
        if (!eventsRef.current) {
            const eventSource = new EventSource('http://127.0.0.1:8000/events');

            eventSource.onopen = () => {
                setConnectedStatus(true);
                setRetryTime(1);
            };
        
            eventSource.onerror = () => {
                setConnectedStatus(false);
                eventSource.close();
                const timeout = Math.min(60, Math.pow(2, retryTime) * 5);
                setRetryTime(timeout);
                setTimeout(() => connect(), timeout * 1000);
            };
        
            eventsRef.current = eventSource;
        }

        if (!stateRef.current) {
            const stateSource = new EventSource('http://127.0.0.1:8000/chat_state/events');

            stateSource.onmessage = (e) => {
                try {
                    let _state = JSON.parse(e.data);
                    console.log(_state)
                    const setStates = (update) => setState({ ...state, room: state.room, rooms: update });
    
                    setStates(_state.rooms);
                    console.log(state)
                } catch (error) {
                    console.log(error);
                }
            };

            stateSource.onopen = () => {
                setConnectedStatus(true);
                setRetryStateTime(1);
            };
        
            stateSource.onerror = () => {
                setConnectedStatus(false);
                stateSource.close();
                const timeout = Math.min(60, Math.pow(2, retryStateTime) * 5);
                setRetryStateTime(timeout);
                setTimeout(() => connect(), timeout * 1000);
            };
        
            stateRef.current = stateSource;
        }
        
    }

    useEffect( () => {
       
        // fetch('http://127.0.0.1:8000/chat_state')
        //     .then( seed => {
                    
        //         seed.json().then( messages => {
        //             console.log(messages)
        //             setState({...state, rooms: messages})
        //         })
                    
        //     })
        //     .catch( error => console.log(error))

        connect()    
    }, [setMessage]); 

 
    const addRoom = (e) => {
        e.preventDefault();
        fetch('http://127.0.0.1:8000/create_room', {
            method: 'POST',
            body: JSON.stringify({ name: newRoom }),
        })
        if (state.rooms.find(room => room.name === newRoom)) {
        changeRoom(newRoom);
        return false;
        }

        const newRooms = [...state.rooms, { name: newRoom, messages: [] }];
        setState({ ...state, rooms: newRooms });
        changeRoom(newRoom);
        return true;
    };
    // think some of the sync issue maybe because how were handling closing and opening connections?
    const changeRoom = (e) => {
        const name =  e.target.name;
        if (state.room === name) return;
        setState({ ...state, room: name });
    
        // eventsRef.current.close()
        // connect()
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (message !== '') {
            fetch('http://127.0.0.1:8000/message', {
                method: 'POST',
                body: JSON.stringify({ room: state.room, username, message }),
            })
            .then( () => {
                setMessage('')
            })
            .catch( error => console.log(error))
        }
        
    };

    return (
        <div className='grid md:grid-cols-6 bg-slate-700 m-1 rounded-lg bg-opacity-80 absolute h-full max-h-full'>
        {/* Left column (hidden on mobile) */}
        <div className='md:col-start-1 md:col-span-1 h-100% border-r border-black p-2 m-6 hidden md:grid   w-fit h-[700px]'>
            <div>
                <p className='text-white font-thin text-4xl mb-4'>Byrne Creek Bros</p>
                <p className='text-white font-thin text-4xl mb-4'>chat server</p> {state.rooms.length}
                <hr />
            </div>

            <div className='overflow-y-scroll flex flex-col-reverse h-auto'>
                {state.rooms?.map((room) => (
                    <button key={room.room} onClick={changeRoom} className='bg-black text-white text-left rounded-md m-2 p-8  -translate-x-6 z-50 overflow-x-hidden' name={room.room} accessKey={room.room}>
                        {room.room + " "}
                       {room.messages[room.messages.length-1]?.username + " " + room.messages[room.messages.length-1]?.message}
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
        <div className='md:col-start-2 md:col-span-4 mb-32 md:ml-32 md:-mr-32 md:pl-12 w-full grid'>
            <div className='flex justify-between'>
                    <p>{state.room}</p>
                    <div>
                    Set username
                    <input type="text" name="name" id="name" autocomplete="off"
                            placeholder="new room..." maxlength="29" value={username} onChange={(e) => setUsername(e.target.value)}></input>
                    </div>
            </div>        
            <div className=''>
                <div className='overflow-y-scroll   mb-4'>
                    <ul key={state.room} className='text-white overflow-scroll h-[700px] -translate-y-12'>
                        {state.rooms.find(room => room.room === state.room)?.messages.map((message, idx) => (
                            <li key={idx} className=''>
                                <b key={idx}>{message.username}</b>: <p className=' '>{message.message}</p>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className='flex w-full absolute bottom-0'>
                    <form className='flex mb-2 w-full '>
                        <input className='text-black w-1/2 m-2' type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Message" />
                        <button className='p-5 m-2 text-white bg-slate-900 rounded-md text-sm' onClick={(e) => handleSendMessage(e)}>Send</button>
                    </form>
                </div>
            </div>
        </div>
    </div>   
    );
}

export default Chat;

