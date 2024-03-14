'use client'
import React, { useState, useEffect, useRef } from 'react';

function Chat() {
    const [connectedStatus, setConnectedStatus] = useState(false);
    const [retryTime, setRetryTime] = useState(1);
    const [retryStateTime, setRetryStateTime] = useState(1);
    const [username, setUsername] = useState('Guest');
    const [message, setMessage] = useState('');
    const [newRoom, setNewRoom] = useState('');
    const [state, setState] = useState({
        room: "nullRoom",
        rooms: [{ name: "lobby", messages: [] }],
        connected: false,
    });
    const eventsRef = useRef(null);
    const stateRef = useRef(null);
   
    const scrollBottom = () => {
        let chatScreen = document.getElementById("messageBody");
        let height = chatScreen.scrollHeight;
        chatScreen.scrollTo(0, height);
    }
 
    const connect = () => {
        // Streams messages for constructing state
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
        // Streams state keeping clients synced
        if (!stateRef.current) {
            const stateSource = new EventSource('http://127.0.0.1:8000/chat_state/events');

            stateSource.onmessage = (e) => {
                try {
                    let _state = JSON.parse(e.data);
                    const setStates = (update) => setState({ ...state, room: state.room =='nullRoom'? "lobby" : state.room, rooms: update });
                    setStates(_state.rooms);
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
        if(state.room == 'nullRoom') {
            fetch('http://127.0.0.1:8000/seed')
            .then( seed => {
                // if the client has not been initialized, seed it with newest state    
                seed.json().then( messages => {
                    setState({...state, room: state.room =='nullRoom'? "lobby" : state.room, rooms: messages});
                })    
            })
            .catch( error => console.log(error))
        }
        
        connect()    
        scrollBottom()

    }, [state.room, state]); 

 
    const addRoom = (e) => {
        e.preventDefault();
        if(newRoom != '' && newRoom != undefined){
            fetch('http://127.0.0.1:8000/create_room', {
            method: 'POST',
            body: JSON.stringify({ name: newRoom }),
            })
            if (state.rooms.find(room => room.name === newRoom)) {
            changeRoom(newRoom);
            return false;
            }

            const newRooms = [...state.rooms, { name: newRoom, messages: [] }];
            setNewRoom('');
            setState({ ...state, rooms: newRooms });
            changeRoom(newRoom);
            return true;
        }
    };

    const changeRoom = (e) => {
        const name =  e.target.name;
        if (state.room === name) return;
        setState({ ...state, room: name });
        scrollBottom();
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
        <div className='grid md:grid-cols-6 bg-slate-700 border border-cyan-400 m-1 rounded-lg bg-opacity-80 p-4'>
        {/* Left column (hidden on mobile) */}
        <div className='md:col-start-1 md:col-span-1 h-100% border-r border-emerald-600 p-2 m-6 hidden md:grid   w-fit h-[750px]'>
            <div className='mb-4 text-white'>
                <p className='font-thin text-4xl mb-4'>Byrne Creek Bros</p>
                <p className='font-thin text-4xl mb-4'>chat server</p> 
                {state.rooms.length} chat rooms
                <hr className='border-r border-emerald-600 mr-6' />
            </div>

            <div className='overflow-y-scroll flex flex-col-reverse h-auto mb-6'>
                {state.rooms?.map((room) => (
                    <button 
                        key={room.room} 
                        onClick={changeRoom} 
                        className={'bg-black text-white text-center rounded-md m-1 p-8 mr-8 z-50 overflow-hidden ' + (state.room == room.room? 'border border-cyan-400' : '')} 
                        name={room.room} accessKey={room.room}
                        >
                            {room.room + " " + 
                            (room.messages[room.messages.length-1]?.username? room.messages[room.messages.length-1].username : "")  + " " + 
                            (room.messages[room.messages.length-1]?.message != undefined ? room.messages[room.messages.length-1]?.message : '')}
                    </button>
                ))}
            </div>
            <form id="new-room" className='flex place-self-end justify-start w-full h-12 pr-8 mt-4'>
                <input type="text" name="name" id="name" autocomplete="off"
                    placeholder="new room..." maxlength="29" value={newRoom} onChange={(e) => setNewRoom(e.target.value)}></input>
                <button onClick={(e) => addRoom(e)} className='bg-emerald-600 w-full h-full p-2 ml-1 -mr-3'>+</button>
            </form>
        </div>
        

        {/* Right column */}
        <div className='md:col-start-2 md:col-span-4 md:ml-32 md:-mr-32 md:pl-12 w-full grid z-50'>       
            <div className=''>
                <div className='mb-4'>
                    <ul id='messageBody' key={state.room} className='text-white overflow-y-scroll overflow-x-clip h-[700px] text-wrap'>
                        {state.rooms.find(room => room.room === state.room)?.messages.map((message, idx) => (
                            <li key={idx} className='text-wrap '>
                                <b key={idx}>{message.username}</b>: <p className='text-wrap max-w-[420px]'>{message.message}</p>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className='flex w-full mt-2 justify-around'>
                    <form className='flex mb-2 w-full '>
                        <input className='text-black w-1/2 m-2 p-3' type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Message" />
                        <button className='p-5 m-2 text-white bg-emerald-600 rounded-md text-sm' onClick={(e) => handleSendMessage(e)}>Send</button>
                        <button className='p-5 m-2 text-white bg-slate-600 rounded-md text-sm inline-block md:hidden'>Menu</button>
                    </form>
                </div>
            </div>
        </div>
        {/*  Side menu  Large Screen*/}
        <div className='md:col-start-6 md:col-span-1 text-white text-right'>
            Logged in as {username}  
            <br/>
            In chatroom {state.room}              
        </div>
    </div>   
    );
}

export default Chat;

