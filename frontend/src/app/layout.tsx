import './globals.css';
import { ApolloWrapper } from './ApolloWrapper';
import { Inter, Public_Sans } from "next/font/google";
import { cn } from "@/lib/utils";

const publicSansHeading = Public_Sans({subsets:['latin'],variable:'--font-heading'});

const inter = Inter({subsets:['latin'],variable:'--font-sans'});


export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className={cn("font-sans", inter.variable, publicSansHeading.variable)}>
            <body>
                <ApolloWrapper>{children}</ApolloWrapper>
            </body>
        </html>
    );
}
