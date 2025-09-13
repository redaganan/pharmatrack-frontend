export const checkout = async (url: string, data: any) => {
	const response = await fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(data),
	});
	return response.json();
};

export const recentOrders = async (url: string) => {
    const response = await fetch(url);
    return response.json();
};