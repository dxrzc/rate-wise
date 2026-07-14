import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'

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
            <div>
            {messages.map(message => (
                <div key={message.id}>
                    <h2>{message.role === 'user' ? 'User: ' : 'AI: '}</h2>
                    {message.parts.map((part, index) =>
                        part.type === 'text' ? (
                            <ReactMarkdown key={index} remarkPlugins={[remarkGfm]}>
                                {part.text}
                            </ReactMarkdown>
                        ) : null,
                    )}
                </div>
            ))}
            </div>

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