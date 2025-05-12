import { Project } from "./types";

export const getCurrentIndex = (project : Project) => project.project_type === "invoice" ? getCurrentInstallmentIndex(project) : calculateCurrentYear(project)

export const calculateNumberOfYears = (start: Date, end: Date) => {
    const startYear = start.getMonth() < 3 ? start.getFullYear() - 1 : start.getFullYear();
    const endYear = end.getMonth() < 3 ? end.getFullYear() - 1 : end.getFullYear();

    const yearsDiff = endYear - startYear + 1;
    return (yearsDiff >= 1 ? yearsDiff : 0);
};

export const formatDate = (dateStr?: string) =>
    dateStr ? new Date(dateStr).toLocaleDateString("en-IN") : "N/A";

export const formatCurrency = (amount: number | null) =>
    (amount ?? 0).toLocaleString("en-IN", { style: "currency", currency: "INR" });

const calculateCurrentYear = (data: Project) => {

    if (data.override) return data.override.index

    const curr = new Date();

    if (curr > new Date(data.end_date!)) {
        return -1
    }

    const start = new Date(data.start_date!);
    let currentYear = curr.getFullYear() - start.getFullYear(); //should be +1, 0-indexing makes it +0

    if (curr.getMonth() >= 3) currentYear++ //should be +2, but 0 indexing makes it +1
    if (start.getMonth() >= 3) currentYear--;

    return (currentYear >= 0 ? currentYear : 0);
};

const getCurrentInstallmentIndex = (project: Project): number => {

    if (project.override) return project.override.index

    const currentDate = new Date();

    for (let i = 0; i < project.installments!.length; i++) {
        const installment = project.installments![i];
        const startDate = new Date(installment.start_date);
        const endDate = new Date(installment.end_date);

        if (currentDate >= startDate && currentDate <= endDate) {
            return i;
        }
    }

    return -1
}