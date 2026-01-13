export default function ObjectControls({ hoverRadius, setHoverRadius, trailLifetime, setTrailLifetime, blockSize, setBlockSize, easing, setEasing, pingPongStart, setPingPongStart, pingPongEnd, setPingPongEnd }:
    {
        hoverRadius: number, setHoverRadius: (value: number) => void,
        trailLifetime: number, setTrailLifetime: (value: number) => void, blockSize: number,
        setBlockSize: (value: number) => void, easing?: number,
        setEasing?: (value: number) => void, pingPongStart?: number,
        setPingPongStart?: (value: number) => void, pingPongEnd?: number,
        setPingPongEnd?: (value: number) => void
    }) {
    return (<div className="controls-container grid grid-cols-2 gap-4 absolute top-4 left-1/2 transform -translate-x-1/2 z-[100]">
        <div className=" w-[400px] h-16 z-[100] flex items-center justify-center bg-white bg-opacity-90 rounded-xl shadow-2xl p-3 pointer-events-auto">
            <label htmlFor="hover-radius-slider" className="mr-3 text-pink-700 font-semibold">
                Hover Radius
            </label>
            <input
                id="hover-radius-slider"
                type="range"
                min="1"
                max="10"
                step="0.1"
                value={hoverRadius}
                onChange={(e) => setHoverRadius(Number(e.target.value))}
                className="flex-1 accent-pink-500 mx-2"
                style={{ width: "180px" }}
            />
            <span className="ml-3 px-2 leading-none rounded bg-pink-100 text-pink-700 font-mono">{hoverRadius.toFixed(1)}</span>
        </div>
        <div className=" w-[400px] h-16 z-[100] flex items-center justify-center bg-white bg-opacity-90 rounded-xl shadow-2xl p-3 pointer-events-auto">
            <label htmlFor="hover-radius-slider" className="mr-3 text-pink-700 font-semibold">
                Trail Lifetime
            </label>
            <input
                id="hover-radius-slider"
                type="range"
                min="1"
                max="10"
                step="0.1"
                value={trailLifetime}
                onChange={(e) => setTrailLifetime(Number(e.target.value))}
                className="flex-1 accent-pink-500 mx-2"
                style={{ width: "180px" }}
            />
            <span className="ml-3 px-2 leading-none rounded bg-pink-100 text-pink-700 font-mono">{trailLifetime.toFixed(1)}</span>
        </div>
        <div className=" w-[400px] h-16 z-[100] flex items-center justify-center bg-white bg-opacity-90 rounded-xl shadow-2xl p-3 pointer-events-auto">
            <label htmlFor="block-size-slider" className="mr-3 text-pink-700 font-semibold">
                Block Size
            </label>
            <input
                id="block-size-slider"
                type="range"
                min="5"
                max="32"
                step="1"
                value={blockSize ?? 16}
                onChange={(e) => setBlockSize(Number(e.target.value))}
                className="flex-1 accent-pink-500 mx-2"
                style={{ width: "180px" }}
            />
            <span className="ml-3 px-2 leading-none rounded bg-pink-100 text-pink-700 font-mono">{(blockSize ?? 16)}</span>
        </div>
        {easing && <div className=" w-[400px] h-16 z-[100] flex items-center justify-center bg-white bg-opacity-90 rounded-xl shadow-2xl p-3 pointer-events-auto">
            <label htmlFor="easing-slider" className="mr-3 text-pink-700 font-semibold">
                Easing
            </label>
            <input
                id="easing-slider"
                type="range"
                min="0"
                max="10"
                step="0.1"
                value={easing}
                onChange={(e) => setEasing?.(Number(e.target.value))}
                className="flex-1 accent-pink-500 mx-2"
                style={{ width: "180px" }}
            />
            <span className="ml-3 px-2 leading-none rounded bg-pink-100 text-pink-700 font-mono">{easing.toFixed(1)}</span>
        </div>}
        {pingPongStart && pingPongEnd && <div className=" w-[400px] h-16 z-[100] flex items-center justify-center bg-white bg-opacity-90 rounded-xl shadow-2xl p-3 pointer-events-auto">
            <label htmlFor="ping-pong-start-slider" className="mr-3 text-pink-700 font-semibold">
                Ping Pong Start
            </label>
            <input
                id="ping-pong-start-slider"
                type="range"
                min="0"
                max="10"
                step="0.1"
                value={pingPongStart}
                onChange={(e) => setPingPongStart?.(Number(e.target.value))}
                className="flex-1 accent-pink-500 mx-2"
                style={{ width: "180px" }}
            />
            <span className="ml-3 px-2 leading-none rounded bg-pink-100 text-pink-700 font-mono">{pingPongStart.toFixed(1)}</span>
        </div>}
        {pingPongStart && pingPongEnd && <div className=" w-[400px] h-16 z-[100] flex items-center justify-center bg-white bg-opacity-90 rounded-xl shadow-2xl p-3 pointer-events-auto">
            <label htmlFor="ping-pong-end-slider" className="mr-3 text-pink-700 font-semibold">
                Ping Pong End
            </label>
            <input
                id="ping-pong-end-slider"
                type="range"
                min="0"
                max="10"
                step="0.1"
                value={pingPongEnd}
                onChange={(e) => setPingPongEnd?.(Number(e.target.value))}
                className="flex-1 accent-pink-500 mx-2"
                style={{ width: "180px" }}
            />
            <span className="ml-3 px-2 leading-none rounded bg-pink-100 text-pink-700 font-mono">{pingPongEnd.toFixed(1)}</span>
        </div>}
    </div>)
}