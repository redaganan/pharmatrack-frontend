export const createAccount = async (url: string, data: object) => {
    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return await res.json();
}

export const loginAccount = async (url: string, data: object) => {
    const res = await fetch(url, {
        method: "POST", 
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return await res.json();
}

// logoutAccount removed (frontend-only logout in Sidebar)
