export function clampScore(value: number, max: number): number {
    return Math.min(max, Math.max(0, value));
}

export function normalizeText(value: string): string {
    return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function normalizeLooseText(value: string): string {
    return normalizeText(value).replace(/[^\p{L}\p{N}\s]/gu, '');
}

export function normalizeStringArray(values: string[]): string[] {
    return values
        .map((value) => normalizeText(value))
        .filter((value) => value.length > 0);
}

export function roundScore(value: number): number {
    return Math.round(value);
}

export function toLetterGrade(percentage: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (percentage >= 90) {
        return 'A';
    }
    if (percentage >= 80) {
        return 'B';
    }
    if (percentage >= 70) {
        return 'C';
    }
    if (percentage >= 60) {
        return 'D';
    }
    return 'F';
}

