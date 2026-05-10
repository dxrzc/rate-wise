import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState } from 'react';

const API_BASE_URL =
    (window as Window & { __ENV__?: { API_BASE_URL?: string } }).__ENV__?.API_BASE_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:3000";

export default function Chat() {
    const api = `${API_BASE_URL}/ai/chat`;
    const { messages, sendMessage, status } = useChat({
        transport: new DefaultChatTransport({ api }),
    });
    const [input, setInput] = useState('');

    return (
        <>
            {messages.map(message => (
                <div key={message.id}>
                    {message.role === 'user' ? 'User: ' : 'AI: '}
                    {message.parts.map((part, index) =>
                        part.type === 'text' ? <span key={index}>{part.text}</span> : null,
                    )}
                </div>
            ))}

            <form
                onSubmit={e => {
                    e.preventDefault();
                    if (input.trim()) {
                        sendMessage({ text: input });
                        setInput('');
                    }
                }}
            >
                <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    disabled={status !== 'ready'}
                    placeholder="Say something..."
                />
                <button type="submit" disabled={status !== 'ready'}>
                    Submit
                </button>
            </form>
        </>
    );
}