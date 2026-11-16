function AtlasBackground() {
    return (
        <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 1600 1200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Círculo exterior */}
            <circle
                cx="800"
                cy="250"
                r="380"
                stroke="#A8864B"
                strokeWidth="1"
                opacity="0.08"
            />

            <circle
                cx="800"
                cy="250"
                r="250"
                stroke="#A8864B"
                strokeWidth="1"
                opacity="0.06"
            />

            <circle
                cx="800"
                cy="250"
                r="120"
                stroke="#A8864B"
                strokeWidth="1"
                opacity="0.05"
            />

            {/* Cruz central */}
            <line
                x1="800"
                y1="0"
                x2="800"
                y2="600"
                stroke="#A8864B"
                opacity="0.05"
            />

            <line
                x1="420"
                y1="250"
                x2="1180"
                y2="250"
                stroke="#A8864B"
                opacity="0.05"
            />

            {/* Nodos */}
            <circle cx="800" cy="250" r="6" fill="#D4AF6A" opacity="0.15" />

            <circle cx="800" cy="-130" r="4" fill="#D4AF6A" opacity="0.12" />
            <circle cx="800" cy="630" r="4" fill="#D4AF6A" opacity="0.12" />

            <circle cx="420" cy="250" r="4" fill="#D4AF6A" opacity="0.12" />
            <circle cx="1180" cy="250" r="4" fill="#D4AF6A" opacity="0.12" />

            {/* Constellation 1 */}

            <line
                x1="350"
                y1="500"
                x2="450"
                y2="430"
                stroke="#A8864B"
                opacity="0.08"
            />

            <line
                x1="450"
                y1="430"
                x2="560"
                y2="520"
                stroke="#A8864B"
                opacity="0.08"
            />

            <circle
                cx="350"
                cy="500"
                r="3"
                fill="#D4AF6A"
                opacity="0.15"
            />

            <circle
                cx="450"
                cy="430"
                r="3"
                fill="#D4AF6A"
                opacity="0.15"
            />

            <circle
                cx="560"
                cy="520"
                r="3"
                fill="#D4AF6A"
                opacity="0.15"
            />

            {/* Constellation 2 */}

            <line
                x1="1150"
                y1="420"
                x2="1280"
                y2="500"
                stroke="#A8864B"
                opacity="0.08"
            />

            <line
                x1="1280"
                y1="500"
                x2="1380"
                y2="430"
                stroke="#A8864B"
                opacity="0.08"
            />

            <circle
                cx="1150"
                cy="420"
                r="3"
                fill="#D4AF6A"
                opacity="0.15"
            />

            <circle
                cx="1280"
                cy="500"
                r="3"
                fill="#D4AF6A"
                opacity="0.15"
            />

            <circle
                cx="1380"
                cy="430"
                r="3"
                fill="#D4AF6A"
                opacity="0.15"
            />

            <path
                d="M 300 700 Q 600 500 900 650"
                stroke="#A8864B"
                strokeWidth="1"
                opacity="0.04"
                fill="none"
            />

            <path
                d="M 900 650 Q 1150 780 1400 600"
                stroke="#A8864B"
                strokeWidth="1"
                opacity="0.04"
                fill="none"
            />

            <circle
                cx="300"
                cy="700"
                r="4"
                fill="#D4AF6A"
                opacity="0.12"
            />

            <circle
                cx="900"
                cy="650"
                r="4"
                fill="#D4AF6A"
                opacity="0.12"
            />

            <circle
                cx="1400"
                cy="600"
                r="4"
                fill="#D4AF6A"
                opacity="0.12"
            />



        </svg>
    );
}

export default AtlasBackground;