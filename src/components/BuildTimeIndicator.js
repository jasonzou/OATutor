import { BUILD_TIMESTAMP } from "../util/runtimeEnv";

export default function BuildTimeIndicator (props) {
    const buildTime = +BUILD_TIMESTAMP

    if (isNaN(buildTime)) {
        return <></>
    }

    return <h4>
        (Built on: {new Date(buildTime).toUTCString()})
    </h4>
}
