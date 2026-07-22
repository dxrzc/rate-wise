import './globals.css';
import { Geist } from 'next/font/google';
import { cn } from '@/lib/utils';
import { ApolloWrapper } from './ApolloWrapper';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className={cn('font-sans', geist.variable)}>
            <body className="antialiased">
                <ApolloWrapper>{children}</ApolloWrapper>
            </body>
        </html>
    );
}
