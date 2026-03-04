// Types for the Homework System
export interface Student {
    id: number;
    class: string;
    name: string;
    school: string;
    grade: string;
}

export interface HomeworkEntry {
    vocabulary: string;
    vocabularyTest: string;
    phonics: string;
    phonicsProgress: string;
    reading: string;
    other: string;
    grammar: string;
    quizletEnabled: boolean;
    quizletUrl: string;
    vocabularyPass: boolean;
    phonicsPass: boolean;
    quizletPass: boolean;
    prepareQuizlet: boolean;
    grammarComplete: boolean;
    feedback: string;
    finalized: boolean;
    finalizedAt: string | null;
}

export interface StudentProgress {
    vocabulary: {
        currentUnit: number;
        currentStage: number;
        currentPart: number;
    };
}

export const SPECIAL_CLASSES = ['가니메데', '유로파 A', '유로파 B', '타이탄 A', '타이탄 B'];

export function isSpecialClass(className: string): boolean {
    return SPECIAL_CLASSES.includes(className);
}

export function createDefaultHomework(): HomeworkEntry {
    return {
        vocabulary: '',
        vocabularyTest: '',
        phonics: '',
        phonicsProgress: '',
        reading: '',
        other: '',
        grammar: '',
        quizletEnabled: true,
        quizletUrl: '',
        vocabularyPass: true,
        phonicsPass: true,
        quizletPass: true,
        prepareQuizlet: true,
        grammarComplete: false,
        feedback: '',
        finalized: false,
        finalizedAt: null,
    };
}

export function createDefaultProgress(): StudentProgress {
    return {
        vocabulary: { currentUnit: 1, currentStage: 1, currentPart: 1 },
    };
}

// Initial student data (seed from current homework system)
export const SEED_STUDENTS: Student[] = [
    { id: 1, class: "Halfmoon A", name: "전주형", school: "안일초", grade: "초4" },
    { id: 2, class: "Halfmoon A", name: "김시은", school: "샘모루초", grade: "초4" },
    { id: 3, class: "Halfmoon A", name: "김지우", school: "안양동초", grade: "초3" },
    { id: 4, class: "Halfmoon A", name: "이도후", school: "샘모루초", grade: "초4" },
    { id: 5, class: "NewMoon A", name: "문모아", school: "", grade: "초1" },
    { id: 6, class: "NewMoon A", name: "이하람", school: "", grade: "초3" },
    { id: 7, class: "NewMoon A", name: "황지욱", school: "", grade: "초2" },
    { id: 8, class: "NewMoon C", name: "김리안", school: "중앙초", grade: "초2" },
    { id: 9, class: "NewMoon C", name: "어준혁", school: "", grade: "초2" },
    { id: 10, class: "NewMoon C", name: "양지후", school: "중앙초", grade: "초2" },
    { id: 11, class: "NewMoon C", name: "이지한", school: "샘모루초", grade: "초3" },
    { id: 12, class: "NewMoon C", name: "이지훈", school: "샘모루초", grade: "초3" },
    { id: 13, class: "NewMoon C", name: "정채린", school: "중앙초", grade: "초2" },
    { id: 14, class: "가니메데", name: "김시연", school: "임곡중", grade: "중3" },
    { id: 16, class: "가니메데", name: "신민경", school: "덕천초", grade: "초6" },
    { id: 17, class: "가니메데", name: "정희준", school: "평촌고", grade: "고1" },
    { id: 15, class: "유로파 A", name: "김정우", school: "임곱중", grade: "중3" },
    { id: 19, class: "유로파 A", name: "김예지", school: "안양외고", grade: "고1" },
    { id: 21, class: "유로파 A", name: "신현호", school: "평촌고", grade: "고1" },
    { id: 18, class: "유로파 B", name: "조유주", school: "임곱중", grade: "중1" },
    { id: 20, class: "유로파 B", name: "김한울", school: "임곱중", grade: "중3" },
    { id: 22, class: "유로파 B", name: "정지연", school: "임곱중", grade: "중3" },
    { id: 24, class: "유로파 B", name: "조유이", school: "문화여고", grade: "고2" },
    { id: 25, class: "칼리스토 A", name: "김석준", school: "안양동초", grade: "초6" },
    { id: 26, class: "칼리스토 A", name: "김승준", school: "안양동초", grade: "초6" },
    { id: 27, class: "칼리스토 A", name: "김온유", school: "중앙초", grade: "초6" },
    { id: 28, class: "칼리스토 A", name: "신아민", school: "안양동초", grade: "초6" },
    { id: 29, class: "칼리스토 A", name: "오예원", school: "중앙초", grade: "초6" },
    { id: 30, class: "칼리스토 A", name: "홍주연", school: "샘모루초", grade: "초5" },
    { id: 31, class: "칼리스토 B", name: "강현서", school: "샘모루초", grade: "초5" },
    { id: 32, class: "칼리스토 B", name: "김예건", school: "샘모루초", grade: "초5" },
    { id: 33, class: "칼리스토 B", name: "김은총", school: "중앙초", grade: "초6" },
    { id: 34, class: "칼리스토 B", name: "서보민", school: "샘모루초", grade: "초5" },
    { id: 35, class: "칼리스토 B", name: "신백경", school: "덕천초", grade: "초3" },
    { id: 37, class: "칼리스토 B", name: "정세진", school: "샘모루초", grade: "초5" },
    { id: 69, class: "칼리스토 B", name: "최서준", school: "", grade: "" },
    { id: 38, class: "칼리스토 C", name: "구도윤", school: "샘모루초", grade: "초5" },
    { id: 39, class: "칼리스토 C", name: "신시현", school: "안양동초", grade: "초5" },
    { id: 40, class: "칼리스토 C", name: "조은서", school: "샘모루초", grade: "초4" },
    { id: 68, class: "칼리스토 C", name: "김수인", school: "", grade: "초5" },
    { id: 41, class: "크레센트", name: "우도연", school: "덕천초", grade: "초3" },
    { id: 42, class: "크레센트 A", name: "구하나", school: "", grade: "" },
    { id: 43, class: "크레센트 A", name: "김시원", school: "비산초", grade: "초1" },
    { id: 44, class: "크레센트 A", name: "김은유", school: "", grade: "초3" },
    { id: 45, class: "크레센트 A", name: "백서준", school: "샘모루초", grade: "초4" },
    { id: 47, class: "크레센트 A", name: "전제이", school: "안양동초", grade: "초3" },
    { id: 48, class: "크레센트 B", name: "김보겸", school: "중앙초", grade: "초3" },
    { id: 49, class: "크레센트 B", name: "김지오", school: "샘모루초", grade: "초2" },
    { id: 50, class: "크레센트 B", name: "문아늘", school: "안양초", grade: "초2" },
    { id: 51, class: "크레센트 C", name: "김윤아", school: "안양동초", grade: "초4" },
    { id: 52, class: "크레센트 C", name: "박유주", school: "중앙초", grade: "초2" },
    { id: 53, class: "크레센트 C", name: "서여율", school: "", grade: "초3" },
    { id: 54, class: "크레센트 C", name: "신유주", school: "", grade: "초4" },
    { id: 55, class: "크레센트 C", name: "양승유", school: "샘모루초", grade: "초1" },
    { id: 56, class: "크레센트 C", name: "이승준", school: "샘모루초", grade: "초2" },
    { id: 57, class: "크레센트 C", name: "최준명", school: "안양동초", grade: "초4" },
    { id: 59, class: "타이탄 A", name: "김정민", school: "임곱중", grade: "중1" },
    { id: 60, class: "타이탄 A", name: "전설우", school: "임곱중", grade: "중1" },
    { id: 61, class: "타이탄 B", name: "강현우", school: "비산중", grade: "중1" },
    { id: 62, class: "타이탄 B", name: "경서현", school: "임곡중", grade: "중1" },
    { id: 63, class: "타이탄 B", name: "박가온", school: "부흥중", grade: "중1" },
    { id: 64, class: "타이탄 B", name: "오서한", school: "부흥중", grade: "중1" },
    { id: 65, class: "타이탄 B", name: "이종훈", school: "부흥중", grade: "중1" },
    { id: 66, class: "타이탄 B", name: "정혜원", school: "임곡중", grade: "중1" },
    { id: 67, class: "타이탄 B", name: "조하람", school: "임곡중", grade: "중1" },
];
