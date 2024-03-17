'use client'
import React, { useState, useEffect, useRef } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { SettingsIcon } from '@/components/SettingsIcon';
import RoomList from '@/components/RoomList';

function Chat() {
    const {status, data: session } = useSession();
    const router = useRouter();
    const [showSettings, setShowSettings] = useState(false);
    const [connectedStatus, setConnectedStatus] = useState(false);
    const [retryStateTime, setRetryStateTime] = useState(1);
    const [newRoom, setNewRoom] = useState('');
    const [message, setMessage] = useState('');
    const [currRoom, setCurrRoom] = useState('nullRoom');
    const [state, setState] = useState({
        rooms: [{ name: currRoom, messages: [{username:"Friends-os", message: "Create or join a room to send a message"}] }],
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
            
            setState({ ...state, rooms: newRooms });
            changeRoom(newRoom);
            return true;
        }
    };

    const changeRoom = (room) => {  
        setNewRoom('');    
        if (state.room === room) return;

        setCurrRoom(room);
    };

    const changeRoomOnClickHandler = (e) => {
        e.preventDefault();
        const name =  e.target.name;
        if (currRoom === name) return;
        setCurrRoom(name);
    };

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
                    setCurrRoom(messages[messages.length-1].room);
                    setState({...state, rooms: messages});
                })    
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
    <div className={'grid gap-16 md:grid-cols-6 bg-slate-700 border border-cyan-400 m-1 rounded-lg bg-opacity-80 p-4 overflow-y-scroll h-[calc(100vh_-_1vh)] ' + (status === "authenticated" ? 'inline-block' : 'hidden')}>
        {/* Left column (hidden on mobile) */}
        <div className='lg:col-start-1 lg:col-span-1  border-r border-emerald-600 p-2 m-3 hidden lg:grid w-fit   min-h-[700px]'>
            <RoomList
                numberOfRooms = {state.rooms.length}
                rooms = {state.rooms}
                newRoom = {newRoom}
                setNewRoom = {setNewRoom}
                addRoom = {addRoom}
                changeRoomOnClickHandler = {changeRoomOnClickHandler}
                currRoom = {currRoom}
            />
        </div>  

        {/* Right column */}
        <div className=' lg:col-start-2 lg:col-span-3 md:col-start-1 md:col-span-4 lg:ml-10 lg:pl-16 z-40  w-screen md:w-full mx-auto p-1 '>       
            <div className='p-3 min-h-screen'>
            
                    <article id='messageBody' key={currRoom} className='text-white h-[calc(100vh_-_17vh)] w-full overflow-y-scroll overflow-x-clip p-4 flex flex-col mb-12'>
                        {state.rooms.find(room => room.room === currRoom)?.messages.map((message, idx) => (
                            <div className='bg-emerald-800 p-3 pb-4 m-2  rounded-xl border border-black text-left w-fit ml-auto mt-auto'>
                                <p key={idx} className=''>
                                    <em key={idx}>{message.username}:</em> {message.message}
                                    
                                </p>
                            </div>
                        ))}
                    </article>
              
                
                <div className='lg:hidden mb-3 -translate-x-8 flex justify-between'>
                    <button className='p-5 m-2 bg-slate-600 rounded-md text-sm inline-block lg:hidden '>Chats</button>  
                    <SettingsIcon /> 
                </div>
                <div className='flex justify-between -translate-x-8'>
                    <form className='flex mb-2 text-white w-full'>
                        <input className='text-black w-10/12 lg:ml-12  m-2 p-3' type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Message" />
                        <button className='p-5 m-2 bg-emerald-600 rounded-md text-sm' onClick={(e) => messageHandler(e)}>Send</button>
                       
                    </form>
                </div>
            </div>
        </div>
        {/*  Side menu  Large Screen*/}
        <div className='md:col-start-5 md:col-span-2 text-white md:flex flex-col justify-between hidden  ml-4'>
            <div className='flex-col flex justify-between  text-center bg-black p-2 m-3 h-2/6 max-h-auto bg-opacity-40 rounded-lg'>
                <div className='flex justify-end place-items-center p-2'>
                   <div className={`bg-black bg-opacity-30 text-white w-full text-left rounded-md mr-3 p-6  z-40 overscroll-x-none overflow-hidden ${
                      showSettings ? 'hidden' : ''
                    }`}>
                      <button className='bg-slate-700 border text-lg p-2 mt-2 rounded-xl  mr-2  z-50' onClick={logoutHandler}>sign out</button>
                    </div>   
                    <div onClick={() => setShowSettings(!showSettings)}>
                      <SettingsIcon />
                    </div> 
                </div>  
                
                <p className='text-sm'>
                    Logged in as <em className='text-cyan-400'>{session?.user.name}</em> 
                </p>         
                <br/>

                <p className='text-sm'><em className='font-semibold '>In Chatroom:</em> <i className='text-cyan-400'>{currRoom}</i></p>  

                
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