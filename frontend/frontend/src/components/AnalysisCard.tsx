import AtlasSectionHeader from "./AtlasSectionHeader";
function AnalysisCard() {
    return (
        <div
            className="
        bg-[#16120E]
        border
        border-[#A8864B]
        rounded-none
        p-6
        mt-8
        "
        >

            <AtlasSectionHeader
                title="SCHOLAR'S VERDICT"
            />


            <div className="mt-6 grid grid-cols-2 gap-6">

                <div>
                    <p className="text-slate-500 text-sm uppercase tracking-wide">
                        Mapping Performance
                    </p>

                    <p className="text-emerald-400 font-semibold mt-1">
                        Excellent
                    </p>
                </div>

                <div>
                    <p className="text-slate-500 text-sm uppercase tracking-wide">
                        Primary Weakness
                    </p>

                    <p className="text-orange-400 font-semibold mt-1">
                        Chaos Resistance
                    </p>
                </div>

                <div>
                    <p className="text-slate-500 text-sm uppercase tracking-wide">
                        Estimated Gain
                    </p>

                    <p className="text-amber-300 font-semibold mt-1">
                        +18% Survivability
                    </p>
                </div>

                <div>
                    <p className="text-slate-500 text-sm uppercase tracking-wide">
                        Recommended Action
                    </p>

                    <p className="text-sky-400 font-semibold mt-1">
                        Replace Current Ring
                    </p>
                </div>

            </div>



        </div>
    );
}
export default AnalysisCard;//
