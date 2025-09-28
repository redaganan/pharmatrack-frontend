export const getCategories = async (url: string) => {
	try {
		const response = await fetch(url);
		if (!response.ok) throw new Error("Failed to fetch categories");
		return await response.json();
	} catch (error) {
		console.error(error);
		throw error;
	}
};

export const addCategory = async (url: string, data: object) => {
	const res = await fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(data),
	});
	if (!res.ok) throw new Error("Failed to add category");
	return await res.json();
};

export const updateCategory = async (url: string, id: string, data: object) => {

    console.log(id)
	const res = await fetch(`${url}?id=${id}`, {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(data),
	});
	if (!res.ok) throw new Error("Failed to update category");
	return await res.json();
};
