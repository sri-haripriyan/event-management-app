import React, { useRef, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { checkAttendance, getAttendances } from "../services/api";

const AttendancePage = () => {
	const { eventId, title } = useParams();
	const queryClient = useQueryClient();
	const { data, isLoading, isFetching } = useQuery({
		queryKey: ["attendance"],
		queryFn: () => getAttendances(eventId),
	});
	const present = data?.attendances?.filter((el) => el.isAttended === true).length || 0;

	const {
		mutate,
		data: scannedUser,
		isPending,
		isError,
		error,
	} = useMutation({
		mutationKey: ["check-attendance"],
		mutationFn: checkAttendance,
		onSuccess: (scannedUser) => {
			queryClient.setQueryData(["attendance"], (prev) => {
				if (!prev) return;
				return {
					//update the attendance cache
					...prev,
					attendances: prev?.attendances.map((el) =>
						el.email === scannedUser?.data.email
							? {
									...el,
									isAttended: scannedUser?.data.isAttended,
							  }
							: el
					),
				};
			});
		},
		onError: (error) => {
			console.log(error);
		},
	});
	if (isError) {
		console.log(error);
	}
	const html5QrCode = useRef(null);
	const config = { fps: 20, qrbox: { width: 300, height: 300 } };

	const startScanner = () => {
		if (html5QrCode.current) {
			try {
				html5QrCode.current.start(
					{ facingMode: "user" },
					config,
					(decodedText, decodedResult) => {
						try {
							const [decodedEvent, applicationId] = decodedText.split("==");
							if (!isPending)
								mutate({
									eventId,
									decodedText: {
										eventId: decodedEvent,
										applicationId,
									},
								});
						} catch (error) {
							throw error;
						}
					}
				);
			} catch (err) {
				console.log("Error starting scanner: " + err.error);
			}
		} else {
			console.log("Scanner is not initiated properly");
		}
	};

	const stopScanner = () => {
		if (html5QrCode?.current) {
			html5QrCode?.current
				.stop()
				.then(() => {
					console.log("QR code scanner stopped...");
				})
				.catch((err) => {
					console.log("Error stopping the scanner: " + err.error);
				});
		} else {
			console.warn("Scanner is not running");
		}
	};
	useEffect(() => {
		html5QrCode.current = new Html5Qrcode("reader");
	}, []);
	const navigate = useNavigate();
	console.log(present);

	return (
		<div className="text-white font-roboto max-w-screen-xl mx-auto  attend-page">
			<header className="text-center  text-pink-300 ">
				<h1 className="font-bold sm:text-xl md:text-2xl bg-gray-800 w-fit mx-auto py-2 px-5 rounded-md">
					{title}
				</h1>
			</header>
			<main className="md:p-3 min-h-screen p-2">
				<div>
					<h2 className=" text-lg py-1">Applicants information:-</h2>
					<div className="flex flex-col sm:flex-row gap-5  bg-primary px-3 sm:px-0 ">
						<div className="flex gap-5 w-fit bg-primary px-3 py-2">
							<p>Total: {data?.attendances?.length}</p>
							<p className="text-green-300">Present: {present}</p>
							<p className="text-red-300">
								Absent:
								{data?.attendances?.length - present
									? data?.attendances?.length - present
									: 0}
							</p>
						</div>
					</div>
				</div>
				<div className="flex flex-col font-mono  sm:flex-row justify-between ">
					<section className="w-full sm:w-2/3 min-h-40  sm:border-r-2 border-gray-400 max-h-[570px] mt-3 pr-2 overflow-auto attendance-scrollbar ">
						<table className="w-full  text-center bg-gray-900">
							<thead className="sticky top-0 bg-gray-900 z-10">
								<tr className=" bg-gray-900">
									<th className="p-1.5 border-r-2 border-gray-500">S.no</th>
									<th className="p-1.5 border-r-2 border-gray-500">Applicant's Name</th>
									<th className="p-1.5 border-r-2 border-gray-500">Email</th>
									<th className="p-1.5 border-r-2 border-gray-500">Registered events</th>
									<th>Status</th>
								</tr>
							</thead>
							<tbody className="text-sm font-mono font-bold]  ">
								{data?.attendances?.map((applicant, i) => (
									<tr
										className={`${i % 2 === 1 ? "bg-gray-500" : " bg-gray-600"}  `}
										key={i}
									>
										<td>{i + 1}</td>
										<td className=" p-2">{applicant?.userName}</td>
										<td>{applicant?.email}</td>
										<td className="flex flex-wrap gap-2 justify-center">
											{applicant?.appliedTo.map((group) => (
												<span className="block" key={group}>
													{group + ","}
												</span>
											))}
										</td>
										<td
											className={`${
												applicant?.isAttended ? "text-green-500" : "text-red-500"
											}`}
										>
											{applicant?.isAttended ? "Present" : "Absent"}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</section>
					<section className="flex flex-col gap-4 items-center justify-center h-fit">
						<div id="reader" className=" w-[300px] h-[300px] border-2 border-gray-700 "></div>

						{/* <button
							className="p-2  rounded-md bg-blue-500 hover:bg-blue-300 transition duration-150 text-white hover:text-black"
							onClick={() =>
								
							}
						>
							Check Attendance
						</button> */}
						<div className=" flex flex-row gap-2 ">
							<button
								onClick={startScanner}
								className="p-2  rounded-md bg-green-500 hover:bg-green-300 transition duration-150 text-white hover:text-black"
							>
								Start scanning
							</button>

							<button
								onClick={stopScanner}
								className="p-2  rounded-md bg-red-500 hover:bg-red-300 transition duration-150 text-white hover:text-black"
							>
								Stop scanning
							</button>
						</div>

						<div className="  self-start border-2 w-full p-3">
							<h3 className="text-lg font-bold text-green-600 mb-3">Scanner results:</h3>
							{scannedUser && (
								<div className="pl-3 ">
									<p>Name: {scannedUser?.data?.userName}</p>
									<p>E-mail: {scannedUser?.data?.email}</p>
									<p>
										Registered to:{" "}
										{scannedUser?.data?.appliedTo.map((subEvent, i) => (
											<span key={i}>{subEvent + ", "}</span>
										))}
									</p>
								</div>
							)}
							{isError && (
								<div className="text-red-500  ml-auto">
									<h3>{error?.response?.data?.message}</h3>
								</div>
							)}
						</div>
					</section>
				</div>
			</main>
		</div>
	);
};

export default AttendancePage;
