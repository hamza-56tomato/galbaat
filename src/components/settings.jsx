import React, { useState, useEffect, useRef } from 'react';

export const Settings = ({theme, setTheme, isMobile, showChat}) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    const handleClickOutside = (event) => {
        if (menuRef.current && !menuRef.current.contains(event.target)) {
            setMenuOpen(false);
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div id="settings-div" ref={menuRef} className={`${isMobile ? "mobile-settings" : ""} ${isMobile && showChat ? "hide" : ""}`}>
            <div id="settings">
                <button className="fa fa-cog" onClick={() => setMenuOpen(!menuOpen)}></button>
            </div>
            {menuOpen && (
                    <div className="menu">
                        <button onClick={() => setTheme('linear-gradient(grey, black)')}>bleck</button>
                        <button onClick={() => setTheme('linear-gradient(purple, rebeccapurple)')}>purpaal</button>
                        <button onClick={() => setTheme('linear-gradient(lightblue, blue)')}>blue</button>
                        <button onClick={() => setTheme('linear-gradient(lightgreen, green)')}>green</button>
                        <button onClick={() => setTheme('linear-gradient(orange, orangered)')}>orange</button>
                        <button onClick={() => setTheme('linear-gradient(red, darkred)')}>red</button>
                        <button onClick={() => setTheme('linear-gradient(pink, #ff6ec7)')}>pink</button>
                    </div>
                )}
        </div>
    );
}