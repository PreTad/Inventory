import React, { createContext, useEffect, useState } from 'react'




export const AuthContext = createContext();

export const AuthProvider = ({children}) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect( () => {
        const fetchUser = () => {
            const token = localStorage.getItem("access");

            if(!token){
                setLoading(false);
                return;
            }
            try{
                const payloadPart = token.split(".")[1];
                const payloadJson = atob(payloadPart.replace(/-/g, "+").replace(/_/g, "/"));
                const payload = JSON.parse(payloadJson);
                const isExpired = payload?.exp ? payload.exp * 1000 <= Date.now() : false;

                if (isExpired) {
                    localStorage.removeItem("access");
                    localStorage.removeItem("refresh");
                    setUser(null);
                } else {
                    setUser(payload);
                }
            }catch{
                setUser(null);
            }finally{
                setLoading(false);
            }
        };
        fetchUser()
    },[])

    return (
        <AuthContext.Provider value={{user,setUser,loading}}>
            {children}
        </AuthContext.Provider>
    )


}
