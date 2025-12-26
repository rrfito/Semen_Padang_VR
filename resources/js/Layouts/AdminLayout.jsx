import React from "react";
import Sidebar from "@/Components/Admin/Sidebar";
import Header from "@/Components/Admin/Header";
import { ThemeProvider } from "@/Contexts/ThemeContext";

export default function AdminLayout({ children, headerTitle }) {
    return (
        <ThemeProvider>
            <div className="theme-background theme-text min-h-screen font-display transition-colors duration-200 flex flex-col h-screen overflow-hidden">
                {/* Full Width Header */}
                <Header title={headerTitle} />

                <div className="flex flex-1 overflow-hidden relative">
                    {/* Fixed Sidebar */}
                    <Sidebar />

                    {/* Main Content Area */}
                    <div className="flex flex-col flex-1 h-full overflow-hidden relative theme-background">
                        {/* Scrollable Content */}
                        <main className="flex-1 overflow-y-auto custom-scrollbar p-8">
                            <div className="max-w-7xl mx-auto flex flex-col gap-8">
                                {children}
                            </div>
                        </main>
                    </div>
                </div>
            </div>
        </ThemeProvider>
    );
}
