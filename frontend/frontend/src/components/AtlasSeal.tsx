import InquisitorSeal from "./InquisitorSeal";
interface AtlasSealProps {
    label: string;
}

function AtlasSeal({ label }: AtlasSealProps) {
    return (
        <div
            className="
            w-28
            h-28
            border-2
            border-[#A8864B]
            bg-[#16120E]
            relative
            flex
            flex-col
            items-center
            justify-center
            text-[#D4AF6A]
            "
        >
            <div
                className="
                absolute
                inset-1
                border
                border-[#3A2F22]
                pointer-events-none
                "
            />
            <InquisitorSeal />
            



            <div
                className="
                text-[11px]
                mt-2
                font-semibold
                text-[#8C6A34]
                tracking-[0.12em]
                "
                style={{
                    fontFamily: "Cinzel",
                }}
            >
                INQUISITOR
            </div>
        </div>
    );
}

export default AtlasSeal;