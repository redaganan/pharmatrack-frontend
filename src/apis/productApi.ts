export const getProducts = async (url: string) => {
	const res = await fetch(url);
	return await res.json();
};

export const deleteProduct = async (url: string, id: string) => {
	const res = await fetch(`${url}?id=${id}`, {
		method: "DELETE",
	});
	return await res.json();
};

export const addProduct = async (url: string, data: object) => {
    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return await res.json();
};

export const updateProduct = async (url: string, id: string, data: object) => {
    const res = await fetch(`${url}?id=${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return await res.json();
};
