'use client'
import React, { useState, useEffect, useRef, useContext } from 'react';
import { ChatStore } from '@/utils/chatStore';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { SettingsIcon } from '@/components/SettingsIcon';
import RoomList from '@/components/RoomList';
import EmojiPicker from 'emoji-picker-react';

function Chat() {
    const { chat_state, dispatch } = useContext(ChatStore);
    const {status, data: session } = useSession();
    const router = useRouter();
    const [showSettings, setShowSettings] = useState(false);
    const [connectedStatus, setConnectedStatus] = useState(false);
    const [retryStateTime, setRetryStateTime] = useState(1);
    const [newRoom, setNewRoom] = useState('');
    const [message, setMessage] = useState('');
    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

    const stateRef = useRef(null);
   
    const scrollBottom = () => {
        let chatScreen = document.getElementById("messageBody");
        let height = chatScreen.scrollHeight;
        chatScreen.scrollTo(0, height);
    }
    const logoutHandler = () => {
        signOut({ callbackUrl: '/login' });
    }
 
    const connect = () => {

        if (!stateRef.current) {
            const stateSource = new EventSource(process.env.NEXT_PUBLIC_API_BASE_URL + '/chat_state/events'); // Subscribing to server state

            stateSource.onmessage = (e) => {
                try {
                    let chat = JSON.parse(e.data);
                    console.log(chat)
                    dispatch({ type: 'SYNC_SERVER_STATE', payload: chat.rooms });
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
            if (chat_state.rooms.find(room => room.name === newRoom)) {
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
    };

    const messageHandler = (e) => {
        e.preventDefault();
        if (message !== '') {
            fetch(process.env.NEXT_PUBLIC_API_BASE_URL + '/message', {
                method: 'POST',
                body: JSON.stringify({ room: chat_state.currRoom, username: session.user.name, message }),
            })
            .then( () => {
                setMessage('')
            })
            .catch( error => console.log(error))
        }
        
    };

    const handleEmojiClick = (emoji) => {
        console.log(emoji)
        setMessage((prevMessage) => prevMessage + emoji.emoji);
    };

    const toggleEmojis = (e) => {
        e.preventDefault();
        setIsEmojiPickerOpen(!isEmojiPickerOpen);
    }

    useEffect( () => {
        if(chat_state.currRoom == 'nullRoom') {
            fetch(process.env.NEXT_PUBLIC_API_BASE_URL + '/seed')
            .then( seed => {
                seed.json().then( messages => {
                    dispatch({ type: 'SET_CURRENT_ROOM', payload: messages[messages.length-1].room })
                    dispatch({ type: 'SYNC_SERVER_STATE', payload: messages });
                })    
            })
            .catch( error => console.log(error))
        }
        
        connect()    
        scrollBottom()

    }, []); 

    useEffect(() => {
        if (!session) 
          router.push('/login'); 
    }, [router, session]);
    
    
    return (
    <div className={'grid gap-16 md:grid-cols-6 bg-slate-700 border border-cyan-400 m-1 rounded-lg bg-opacity-80 p-4 overflow-y-scroll h-[calc(100vh_-_1vh)] ' + (status === "authenticated" ? 'inline-block' : 'hidden')}>
        {/* Left column (hidden on mobile) */}
        <div className='lg:col-start-1 lg:col-span-1  border-r border-emerald-600 p-2 m-3 hidden lg:grid w-fit   min-h-[700px]'>
            <RoomList
                numberOfRooms = {chat_state.rooms.length}
                rooms = {chat_state.rooms}
                newRoom = {newRoom}
                setNewRoom = {setNewRoom}
                addRoom = {addRoom}
                changeRoomOnClickHandler = {changeRoomOnClickHandler}
                currRoom = {chat_state.currRoom}
                dispatch = {dispatch}
            />
        </div>  

        {/* Right column */}
        <div className=' lg:col-start-2 lg:col-span-3 md:col-start-1 md:col-span-4 lg:ml-10 lg:pl-16 z-40  w-screen md:w-full mx-auto p-1 '>       
            <div className='p-3 min-h-screen flex flex-col place-content-end'>
            
                    <article id='messageBody' key={chat_state.currRoom} className='text-white max-h-[calc(100vh_-_17vh)] w-full overflow-y-scroll overflow-x-clip p-4 grid justify-items-end mb-12'>
                        {chat_state.rooms.find(room => room.room === chat_state.currRoom)?.messages.map((message, idx) => (
                            <div className='bg-emerald-800 p-4 m-2  rounded-xl border border-black text-left w-fit place-self-end '>
                                <p key={idx} className='h-fit'>
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
                    <form className='flex-col mb-2 text-white w-full'>
                        <EmojiPicker open={isEmojiPickerOpen} onEmojiClick={handleEmojiClick} lazyLoadEmojis={true} height={380}/>
                        <button className='p-2 text-black text-sm border border-black m-2 bg-yellow-400 rounded-md float-right' onClick={(e) => toggleEmojis(e)}>
                            Emojis
                        </button>
                        <div className='flex'>
                            <input className='text-black w-10/12 lg:ml-12  m-2 p-3' type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Message" />
                            <button className='p-5 m-2 bg-emerald-600 rounded-md text-sm float-right' onClick={(e) => messageHandler(e)}>Send</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        {/*  Side menu  Large Screen*/}
        <div className='md:col-start-5 md:col-span-2 text-white md:flex flex-col justify-between hidden  ml-4'>
            <div className='flex-col flex justify-between  text-center bg-black p-2 m-3 h-2/6 max-h-auto bg-opacity-40 rounded-lg'>
                <div className='flex justify-end place-items-center p-2'>
                   <div className={`bg-black bg-opacity-30 text-white w-full text-left rounded-md mr-3 p-6  z-40 overscroll-x-none overflow-hidden ${
                      !showSettings ? 'hidden' : ''
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

                <p className='text-sm'><em className='font-semibold '>In Chatroom:</em> <i className='text-cyan-400'>{chat_state.currRoom}</i></p>  

                
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