import { useMutation } from "@tanstack/react-query";
import React, { useState } from "react";
import { updateProfile } from "../services/api";
import { toast } from "react-toastify";
import { useAuth } from "../hooks/useAuth";
const UpdateProfile = ({ user, close }) => {
	const { setUser } = useAuth();
	const [Profile, setProfile] = useState({
		userName: user.userName,
		email: user.email,
		password: "",
		confirmPassword: "",
	});
	const handleClick = (e) => {
		if (e.target.id === "profileBox") close();
	};
	const { mutate, data, isPending } = useMutation({
		mutationFn: updateProfile,
	});
	const handleUpdate = (e) => {
		e.preventDefault();
		if (Profile?.password.trim() !== Profile.confirmPassword.trim()) {
			toast.error("Password mismatch!");
			return;
		}
		mutate(Profile, {
			onSuccess: (data) => {
				setUser(data?.user);
				toast.success(data?.message);
				close();
			},
		});
	};
	const handleChange = (e) => {
		const { name, value } = e.target;
		setProfile((prev) => ({ ...prev, [name]: value }));
	};

	return (
		<div
			id="profileBox"
			onClick={handleClick}
			className=" backdrop-blur-sm z-20 md:max-h-screen  inset-0 absolute "
		>
			<div className="absolute backdrop-blur-lg p-7 max-w-screen-md bg-gray-800  mx-auto blur-none  w-2/3 top-[50%] left-[50%] -translate-x-[50%] -translate-y-[50%] rounded-lg">
				<h1 className="font-mono  text-2xl font-bold text-center mb-6  w-fit mx-auto px-2 py-1">
					Update profile{" "}
				</h1>
				<form
					onSubmit={handleUpdate}
					className="flex flex-col sm:grid sm:grid-cols-2 gap-2 gap-y-6"
				>
					<div className="flex flex-col gap-2">
						<label htmlFor="userName">User name</label>
						<input
							id="userName"
							type="text"
							name="userName"
							className="bg-gray-700 font-serif p-1 border-2 text-sm border-gray-600 rounded-md"
							value={Profile?.userName}
							onChange={handleChange}
						/>
					</div>
					<div className="flex flex-col gap-2">
						<label htmlFor="email">E-mail</label>
						<input
							id="email"
							type="text"
							name="email"
							className="bg-gray-700 font-serif  p-1 border-2 text-sm border-gray-600 rounded-md"
							value={Profile?.email}
							onChange={handleChange}
						/>
					</div>
					<div className="flex flex-col gap-2">
						<label htmlFor="password">Password</label>
						<input
							id="password"
							type="text"
							name="password"
							className="bg-gray-700 font-serif  p-1 border-2 text-sm border-gray-600 rounded-md"
							value={Profile?.password}
							onChange={handleChange}
						/>
					</div>
					<div className="flex flex-col gap-2">
						<label htmlFor="confirmPassword">Re-enter password</label>
						<input
							id="confirmPassword"
							type="text"
							name="confirmPassword"
							className="bg-gray-700 font-serif  p-1 border-2 text-sm border-gray-600 rounded-md"
							value={Profile?.confirmPassword}
							onChange={handleChange}
						/>
					</div>
					<button
						type="submit"
						disabled={isPending}
						className="w-fit mx-auto rounded-md font-semibold border-green-600 text-green-500 col-span-2 px-3  py-2 border-2"
					>
						{isPending ? "Updating..." : "Update"}
					</button>
				</form>
			</div>
		</div>
	);
};

export default UpdateProfile;
