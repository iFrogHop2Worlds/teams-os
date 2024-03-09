'use client'
import React, { useState, useEffect } from 'react';

function Chat() {
  const [messages, setMessages] = useState([
    {
    id: 1,
    username: "bill",
    message: "some text abouut",
    },
    {
    id: 2,
    username: "Jenny",
    message: "What about ittttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt",
    },
    {
    id: 3,
    username: "bill",
    message: "some text abouut",
    },
    {
    id: 4,
    username: "bill",
    message: "some text abouut",
    },
  ]);

  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [chat_rooms, setChatRooms] = useState(["lobby"]); 
  const [new_room, setNewRoom] = useState(''); 

  useEffect(() => {
    const eventSource = new EventSource('ws://127.0.0.1:8000/events');

    eventSource.onmessage = (event) => {
      const newMessage = JSON.parse(event.data);
      console.log(newMessage)
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    };
  
    return () => eventSource.close();
    
  }, []);

  const handleSendMessage = () => {
    if (message !== '') {
      fetch('http://127.0.0.1:8000/message', {
        mode: 'cors',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room: 'lobby', username, message }),
      })
        .then((response) => response.json())
        .then((data) => {
          setMessages((prevMessages) => [...prevMessages, data]);
          setMessage('');
        });
    }
  };

  const addRoom = (e) => {
    e.preventDefault();
    if(chat_rooms.includes(new_room)){
      window.alert("Room already exist");
      return;
    }
    setNewRoom('');
    setChatRooms(prevRooms => [...prevRooms, new_room]);

  }

  return (
    <div className='grid  md:grid-cols-6 bg-slate-700 m-1 rounded-lg bg-opacity-80 absolute  overflow-auto h-full '>
        {/* Left column (hidden on mobile) */}
        <div className='md:col-start-1 md:col-span-1 h-100% border-r border-black p-2 m-6 hidden md:grid overflow-auto w-fit'>
            <div>
                <p className='text-white font-thin text-4xl mb-4'>Byrne Creek Bros</p>
                <p className='text-white font-thin text-4xl mb-4'>chat server</p> {chat_rooms.length}
                <hr />
            </div>

            <div className='grid '>
                {chat_rooms.map((room, idx) => (
                    <div className='bg-black text-white text-left rounded-md m-2 p-4 w-full line-clamp-3 h-fit -translate-x-6' key={idx}>
                        <p className='grid font-semibold text-md'>{room}</p>
                        <p className='text-sm'>Bills: shit smoeone said thidsadfeasd... This sie some shit smoeone said thidsadfeasd... This sie some shit smoeone said thidsadfeasd...</p>
                    </div>
                    
                ))}
            </div>
            <form id="new-room" className='flex place-self-end justify-start w-full h-12 pr-8'>
                <input type="text" name="name" id="name" autocomplete="off"
                    placeholder="new room..." maxlength="29" value={new_room} onChange={(e) => setNewRoom(e.target.value)}></input>
                <button onClick={addRoom} className='bg-green-300 w-full h-full p-2 ml-1 -mr-3'>+</button>
            </form>
        </div>

        {/* Right column */}
        <div className='md:col-start-2 md:col-span-4  mb-32 md:ml-32 md:-mr-32 md:pl-12'>
            <div className='grid h-full place-content-end justify-start'>
                <ul className='text-white h-full overflow-y-auto'>
                    {messages.map((message) => (
                        <li key={message.id}>
                            <b>{message.username}</b>: {message.message}
                        </li>
                    ))}
                </ul>
            </div>

            <div className='flex w-full h-32'>
                <div className='flex mb-2  w-full '>
                    <textarea className='text-black w-full m-2' type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Message" />
                    <button className='p-5 m-2  text-white bg-slate-900 rounded-md text-sm' onClick={handleSendMessage}>Send</button>
                </div>
            </div>
        
        </div>
    </div>  


  );
}

export default Chat;
