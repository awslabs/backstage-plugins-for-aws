import { Task } from "@aws-sdk/client-ecs";
import React, { ReactNode, createContext, useState } from "react";

type TaskContextType = {
    task?: Task;
    setTask: (task: Task) => void;
}
 
export const TaskContext = createContext<TaskContextType>({ setTask: () => {} });

type EcsTaskProviderProps = {
    children: ReactNode
}

export const EcsTaskProvider = ({ children }: EcsTaskProviderProps) => {
    const [task, setTask] = useState<Task|undefined>();
    return (
        <TaskContext.Provider value={{ task, setTask }}>
            {children}
        </TaskContext.Provider>
    );
};

