
export default async function BrandPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const {id} = await params;
    return (
        <div>
            <h1>Brand Page for: {id}</h1>
        </div>
    );
}
