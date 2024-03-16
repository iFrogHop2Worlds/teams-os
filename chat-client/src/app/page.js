'use client'
import React, { useState, useEffect, useRef } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { SettingsIcon } from '@/components/SettingsIcon';

function Chat() {
    const {status, data: session } = useSession();
    const router = useRouter();
  
    const [connectedStatus, setConnectedStatus] = useState(false);
    const [retryStateTime, setRetryStateTime] = useState(1);
    const [newRoom, setNewRoom] = useState('');
    const [deleteRoom, setDeleteRoom] = useState('');
    const [message, setMessage] = useState('');
    const [currRoom, setCurrRoom] = useState('nullRoom');
    const [state, setState] = useState({
        rooms: [{ name: "lobby", messages: [] }],
        connected: false,
    });
  
    const stateRef = useRef(null);
   
    const scrollBottom = () => {
        let chatScreen = document.getElementById("messageBody");
        let height = chatScreen.scrollHeight;
        chatScreen.scrollTo(0, height);
    }
 
    const connect = () => {

        if (!stateRef.current) {
            const stateSource = new EventSource(process.env.NEXT_PUBLIC_API_BASE_URL + '/chat_state/events');

            stateSource.onmessage = (e) => {
                try {
                    let _state = JSON.parse(e.data);
                    const setStates = (update) => setState({ ...state, rooms: update });
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

    const addRoom = (e) => {
        e.preventDefault();
        if(newRoom != '' && newRoom != undefined){
            fetch(process.env.NEXT_PUBLIC_API_BASE_URL + '/create_room', {
            method: 'POST',
            body: JSON.stringify({ name: newRoom }),
            })

            if (state.rooms.find(room => room.name === newRoom)) {
                changeRoom(newRoom);
                return false;
            }

            const newRooms = [...state.rooms, { name: newRoom, messages: [] }];
            
            changeRoom(newRoom);
            setState({ ...state, rooms: newRooms });

            return true;
        }
    };

    const changeRoom = (room) => {  
        setNewRoom('');    
        if (state.room === room) return;

        setCurrRoom(room);
        scrollBottom();
    };

    const changeRoomOnClickHandler = (e) => {
        e.preventDefault();
        const name =  e.target.name;
        if (currRoom === name) return;
        setCurrRoom(name);
        scrollBottom();
    };

    const deletRoomHandler = (e) => {
        e.preventDefault();
        if(deleteRoom == 'lobby'){
            window.alert("Sorry aboot that. But lobby cannot be deleted right now.")
            return
        }

        fetch(process.env.NEXT_PUBLIC_API_BASE_URL + '/delete_room/' + deleteRoom, { method: 'DELETE' })
        if(currRoom == deleteRoom){
           changeRoom('lobby') 
        }
    
        setDeleteRoom('')
    }

    const messageHandler = (e) => {
        e.preventDefault();
        if (message !== '') {
            fetch(process.env.NEXT_PUBLIC_API_BASE_URL + '/message', {
                method: 'POST',
                body: JSON.stringify({ room: currRoom, username: session.user.name, message }),
            })
            .then( () => {
                setMessage('')
            })
            .catch( error => console.log(error))
        }
        
    };

    const logoutHandler = () => {
        signOut({ callbackUrl: '/login' });
      };

    useEffect( () => {
        if(currRoom == 'nullRoom') {
            fetch(process.env.NEXT_PUBLIC_API_BASE_URL + '/seed')
            .then( seed => {
                seed.json().then( messages => {
                    setState({...state, rooms: messages});
                })    
            })
            .then(() => {
                setCurrRoom("lobby")
            })
            .catch( error => console.log(error))
        }
       
        connect()    
        scrollBottom()

    }, [currRoom, state]); 

    useEffect(() => {
        if (!session) 
          router.push('/login'); 
    }, [router, session]);
    
    
    return (
    <div className={'grid gap-16 md:grid-cols-6 bg-slate-700 border border-cyan-400 m-1 rounded-lg bg-opacity-80 p-4 overflow-y-scroll max-h-screen ' + (status === "authenticated" ? 'inline-block' : 'hidden')}>
        {/* Left column (hidden on mobile) */}
        <div className='md:col-start-1 md:col-span-1  border-r border-emerald-600 p-2 m-6 hidden lg:grid w-fit   min-h-[700px] max-h-screen defer '>
            <div className='mb-4 font-thin text-white'>
                <p className=' text-gray-500 text-4xl mb-4'>{process.env.NEXT_PUBLIC_SERVER_NAME}</p>
                <p className=' text-orange-400 text-4xl mb-4'>chat server</p> 
                {state.rooms.length} chat rooms
                <hr className='border-r border-cyan-600 mr-6' />
            </div>

            <div className='overflow-y-scroll flex flex-col-reverse mb-8 -translate-x-6'>
                {state.rooms?.map((room) => (
                    <button 
                        key={room.room} 
                        onClick={changeRoomOnClickHandler} 
                        className={'bg-black text-white text-left rounded-md m-1 p-3 z-50 overflow-hidden ' + (currRoom == room.room? 'border border-cyan-400' : '')} 
                        name={room.room} accessKey={room.room}
                        >
                            {'[' +room.room + '] ' + 
                            (room.messages[room.messages.length-1]?.username? room.messages[room.messages.length-1].username : "")  + ": " + 
                            (room.messages[room.messages.length-1]?.message != undefined ? room.messages[room.messages.length-1]?.message : '')}
                    </button>
                ))}
            </div>
            <form id="new-room" className='flex place-self-end justify-start  h-12 pr-8 -translate-y-6 -translate-x-3'>
                <input type="text" name="name" id="name" autoComplete="off"
                    placeholder="new room..." maxLength="29" value={newRoom} onChange={(e) => setNewRoom(e.target.value)}></input>
                <button onClick={(e) => addRoom(e)} className='bg-emerald-600 w-full h-full p-2 ml-1 -mr-3'>+</button>
            </form>
        </div>  

        {/* Right column */}
        <div className='lg:col-start-2 lg:col-span-3 md:ml-32 md:-mr-32 md:pl-12 grid z-50 lg:-translate-x-12 w-full mx-auto p-1 '>       
            <div className='p-3 min-h-screen w-fit'>
                <div className=''>
                    <article id='messageBody' key={state.room} className='text-white text-wrap h-[calc(100vh_-_15vh)] w-fit 2xl:w-[520px] overflow-y-scroll overflow-x-clip p-4 '>
                        {state.rooms.find(room => room.room === currRoom)?.messages.map((message, idx) => (
                            <div className='bg-emerald-800 p-3 pb-4 m-2 rounded-xl border border-black text-wrap'>
                                <p key={idx} className=''>
                                    <em key={idx}>{message.username}:</em> {message.message}
                                    
                                </p>
                            </div>
                        ))}
                    </article>
                </div>
                <div className='lg:hidden mb-3 mr-6 flex justify-end'><SettingsIcon /></div>
                <div className='flex justify-between '>
                    <form className='flex mb-2 text-white'>
                        <input className='text-black md:w-96 lg:ml-12  m-2 p-3' type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Message" />
                        <button className='p-5 m-2 bg-emerald-600 rounded-md text-sm' onClick={(e) => messageHandler(e)}>Send</button>
                        <button className='p-5 m-2 bg-slate-600 rounded-md text-sm inline-block lg:hidden'>Menu</button>   
                    </form>
                </div>
            </div>
        </div>
        {/*  Side menu  Large Screen*/}
        <div className='md:col-start-5 md:col-span-2 text-white md:flex flex-col justify-between hidden  ml-4'>
            <div className='flex-col flex justify-between  text-center bg-black p-2 m-3 h-2/6 max-h-auto bg-opacity-40 rounded-lg'>
                <div className='flex justify-between place-items-center p-2'>
                    <button className='bg-slate-700 border text-lg p-2 mt-2 rounded-xl  mr-2  z-50' onClick={logoutHandler}>sign out</button>
                    <SettingsIcon />
                </div>   
                <p className='text-sm'>
                    Logged in as <em className='text-cyan-400'>{session?.user.name}</em> 
                </p>         
                <br/>

                <p className='text-sm'><em className='font-semibold '>In Chatroom:</em> <i className='text-cyan-400'>{currRoom}</i></p>  

                <form className='flex justify-evenly'>
                    <input className='text-black w-5/6 m-2 p-3' type="text" value={deleteRoom} onChange={(e) => setDeleteRoom(e.target.value)} placeholder="room name" />
                    <button className='p-5 m-2 bg-red-600 rounded-md text-sm' onClick={(e) => deletRoomHandler(e)}>Delete</button>
                </form> 
            </div>

            <div className='flex-col flex justify-around  text-center bg-black p-2 m-3 h-full bg-opacity-40 rounded-lg '>
                <p>Coming Soon</p><br />
                <p>Voice Calls</p>
                <p>Video Calls</p>
                <p>File System</p>
                <p>Collaborative Spaces</p>
            </div>           
        </div>
    </div>   
    );
}

export default Chat;

Chat.Auth = true;