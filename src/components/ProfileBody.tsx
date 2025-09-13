import React, { useState } from "react";
import "../../styles/LogIn.css";

import { changePassword } from "../apis/accountApi";

const ProfileBody: React.FC = () => {
	const [username, setUsername] = useState(
		localStorage.getItem("username") || ""
	);
	const [current, setCurrent] = useState("");
	const [password, setPassword] = useState("");
	const [confirm, setConfirm] = useState("");
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setSuccess("");
		if (!username || !current || !password || !confirm) {
			setError("Please fill out all fields.");
			return;
		}
		if (password !== confirm) {
			setError("New password and confirm password do not match.");
			return;
		}

		try {
			const url = "http://localhost:8000/api/accounts/change-password"; // Adjust endpoint as needed
			const data = {
				current_password: current,
				new_password: password,
                confirm_password: confirm
			};
            const id = localStorage.getItem("accountId") || "";
			const response = await changePassword(url, data, id);
			if (response.success) {
				setSuccess("Password updated successfully.");
				setCurrent("");
				setPassword("");
				setConfirm("");
			} else {
				setError(response.message || "Failed to update password.");
			}
		} catch (err) {
			setError("An error occurred. Please try again.");
		}
	};

	return (
		<section>
			<form className="login-form" onSubmit={handleSubmit}>
				<h2>Change Password</h2>

				<label htmlFor="username">Username</label>
				<input id="username" type="text" value={username} readOnly />

				<label htmlFor="current">Current Password</label>
				<input
					id="current"
					type="password"
					value={current}
					onChange={(e) => setCurrent(e.target.value)}
				/>

				<label htmlFor="new">New Password</label>
				<input
					id="new"
					type="password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
				/>

				<label htmlFor="confirm">Confirm Password</label>
				<input
					id="confirm"
					type="password"
					value={confirm}
					onChange={(e) => setConfirm(e.target.value)}
				/>

				{error && <div style={{ color: "red" }}>{error}</div>}
				{success && <div style={{ color: "green" }}>{success}</div>}

				<button type="submit">Update Password</button>
			</form>
		</section>
	);
};

export default ProfileBody;
