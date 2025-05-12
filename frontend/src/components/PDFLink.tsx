import { FunctionComponent, ReactNode } from "react";

interface PDFLinkProps {
    url: string;
    children: ReactNode;
}

const PDFLink: FunctionComponent<PDFLinkProps> = ({ url, children }) => {

    const handleClick = async (event: React.MouseEvent) => {
        event.preventDefault(); 

        try {
            
            const response = await fetch(url, { credentials: "include" });

            
            if (!response.ok) {
                throw new Error("Failed to fetch the PDF");
            }

            const blob = await response.blob();
            const newBlobUrl = URL.createObjectURL(blob);
            const linkElement = document.createElement('a');
            linkElement.href = newBlobUrl;
            linkElement.target = '_blank';  
            linkElement.click();  
        } catch (error) {
            console.error("Error fetching PDF:", error);
        }
    };

    return (
        <div className="flex justify-center">
            <button onClick={handleClick} className="text-blue-600 hover:underline">
                {children}
            </button>
        </div>
    );
};

export default PDFLink;