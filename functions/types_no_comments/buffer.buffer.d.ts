declare module "buffer" {
    type ImplicitArrayBuffer<T extends WithImplicitCoercion<ArrayBufferLike>> = T extends { valueOf(): infer V extends ArrayBufferLike } ? V : T;
    global {
        interface BufferConstructor {
            new(str: string, encoding?: BufferEncoding): Buffer<ArrayBuffer>;
            new(size: number): Buffer<ArrayBuffer>;
            new(array: ArrayLike<number>): Buffer<ArrayBuffer>;
            new<TArrayBuffer extends ArrayBufferLike = ArrayBuffer>(arrayBuffer: TArrayBuffer): Buffer<TArrayBuffer>;
            from(array: WithImplicitCoercion<ArrayLike<number>>): Buffer<ArrayBuffer>;
            from<TArrayBuffer extends WithImplicitCoercion<ArrayBufferLike>>(arrayBuffer: TArrayBuffer, byteOffset?: number, length?: number): Buffer<ImplicitArrayBuffer<TArrayBuffer>>;
            from(string: WithImplicitCoercion<string>, encoding?: BufferEncoding): Buffer<ArrayBuffer>;
            from(arrayOrString: WithImplicitCoercion<ArrayLike<number> | string>): Buffer<ArrayBuffer>;
            of(...items: number[]): Buffer<ArrayBuffer>;
            concat(list: readonly Uint8Array[], totalLength?: number): Buffer<ArrayBuffer>;
            copyBytesFrom(view: NodeJS.TypedArray, offset?: number, length?: number): Buffer<ArrayBuffer>;
            alloc(size: number, fill?: string | Uint8Array | number, encoding?: BufferEncoding): Buffer<ArrayBuffer>;
            allocUnsafe(size: number): Buffer<ArrayBuffer>;
            allocUnsafeSlow(size: number): Buffer<ArrayBuffer>;
        }
        interface Buffer<TArrayBuffer extends ArrayBufferLike = ArrayBufferLike> extends Uint8Array<TArrayBuffer> {
            slice(start?: number, end?: number): Buffer<ArrayBuffer>;
            subarray(start?: number, end?: number): Buffer<TArrayBuffer>;
        }
        type NonSharedBuffer = Buffer<ArrayBuffer>;
        type AllowSharedBuffer = Buffer<ArrayBufferLike>;
    }
    
}
