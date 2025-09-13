export const getDashboardData = async (url: string) => {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error("Failed to fetch dashboard data");
	}
	return response.json();
};
