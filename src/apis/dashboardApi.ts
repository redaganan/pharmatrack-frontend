export const getDashboardData = async (url: string) => {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error("Failed to fetch dashboard data");
	}
	return response.json();
};

export const notifyOwners = async (url: string) => {
	const response = await fetch(url, {
		method: "POST",
	});
	if (!response.ok) {
		throw new Error("Failed to notify owners");
	}
	return response.json();
};
