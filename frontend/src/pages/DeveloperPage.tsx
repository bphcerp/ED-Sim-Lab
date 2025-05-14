import { FunctionComponent } from "react";

type Developer = {
    id: string;
    name: string;
    email: string;
    type: 'developer';
}

type Supervisor = {
    name: string;
    email: string;
    type: 'supervisor';
}

const developers: Developer[] = [
    { id: "2022AAPS0274H", name: "Pranav Poluri", email: "f20220274@hyderabad.bits-pilani.ac.in", type : 'developer' }
];

const supervisors: Supervisor[] = [
    { name: "Prof. Supradeepan K", email: "supradeepan@hyderabad.bits-pilani.ac.in", type : 'supervisor' },
]

const DeveloperPage: FunctionComponent = () => {
    return (
        <div className="flex flex-col space-y-6 items-center w-full h-full p-5">
            <h1 className="text-3xl font-bold text-gray-800 text-center">The Team</h1>
            <p className="text-lg text-gray-700 text-center">
                If you have any issues with this portal, feel free to reach out to:
            </p>

            <div className="flex flex-wrap justify-center gap-6">
                {developers.map((developer) => (
                    <div
                        key={developer.id}
                        className="bg-white shadow-lg rounded-lg p-10 w-full max-w-xs border border-gray-200 hover:shadow-xl transition-shadow duration-300"
                    >
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">{developer.name}</h3>
                        <p className="text-sm text-gray-600 mb-1">
                            <span className="font-medium text-gray-800">ID:</span> {developer.id}
                        </p>
                        <p className="text-sm text-gray-600">
                            <span className="font-medium text-gray-800">Email:</span>{" "}
                            <a
                                href={`mailto:${developer.email}`}
                                className="text-blue-600 hover:underline"
                            >
                                {developer.email}
                            </a>
                        </p>
                    </div>
                ))}
            </div>
            <div className="text-xl flex justify-center items-center space-x-3 text-gray-700 text-center max-w-2xl">
                <span>Made for Nano Scale Device Lab under the supervision of</span>
            </div>
            {supervisors.map((supervisor) => (

                <div
                    key={supervisor.email}
                    className="bg-white shadow-lg rounded-lg p-10 w-full max-w-xs border border-gray-200 hover:shadow-xl transition-shadow duration-300"
                >
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">{supervisor.name}</h3>
                    <p className="text-sm text-gray-600">
                        <span className="font-medium text-gray-800">Email:</span>{" "}
                        <a
                            href={`mailto:${supervisor.email}`}
                            className="text-blue-600 hover:underline"
                        >
                            {supervisor.email}
                        </a>
                    </p>
                </div>
            ))}
        </div>
    );
};

export default DeveloperPage;
