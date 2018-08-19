declare module 'flash-emu' {
  type Value = RefValue | Primitive
  type RefValue = object
  type Primitive =
    | boolean
    | number
    | string
    | symbol
    | null
    | undefined
  enum NamespaceType {
    Public          = 0,
    Protected       = 1,
    PackageInternal = 2,
    Private         = 3,
    Explicit        = 4,
    StaticProtected = 5
  }
  class Namespace {
    static PublicMangledName: string
    constructor (_type: NamespaceType, _uri: string, _prefix?: string)
    static Package (name: string): Namespace
    static PackageInternal (name: string): Namespace
    static readonly Public: Namespace
    static Private (uri?: string): Namespace
    static MangledName (type: NamespaceType, uri: string, prefix: string): string
    readonly type: NamespaceType
    readonly uri: string
    readonly prefix: string
    readonly mangledName: string
    isPublic (): boolean
    Multiname (name: string): Namespace
    toString (): string
  }
  class Multiname {
    kind: number
    name: string
    nsSet: Namespace[]
    factory: Multiname
    params: Multiname[]
    static Public (name: string): Multiname
    static Package (pkg: string, name: string): Multiname
    static PackageInternal (pkg: string, name: string): Multiname
    static QName (ns: Namespace, name: string): Multiname
    static PublicMangledName (name: string): string
    static MangledName (namespace: Namespace, name: string): string
    static stripPublicMangledName (name: string): string
    readonly mangledName: string
    toString (): string
    isRuntimeName (): boolean
    isRuntime (): boolean
    isRuntimeNamespace (): boolean
    isAttribute (): boolean
    isAnyName (): boolean
  }
  interface IProxy {
    callProperty (name: string, ...args: Value[]): Value
  }
  interface IValueManager {
    initProperty (self: RefValue, mn: Multiname, value: Value): void
    setProperty (self: RefValue, mn: Multiname, value: Value): void
    setDescriptor (self: RefValue, mn: Multiname, value: Value): void
    getProperty (self: RefValue, mn: Multiname): Value
    hasProperty (self: RefValue, mn: Multiname): boolean
    deleteProperty (self: RefValue, mn: Multiname): boolean
    getEnumerableKeys (self: RefValue): string[]
    hasPropertyInternal (self: RefValue, mn: Multiname): boolean
    setSlot (self: RefValue, index: number, value: Value): void
    getSlot (self: RefValue, index: number): Value
    newObject (app: ApplicationDomain): RefValue
    registerObject (obj: RefValue, app: ApplicationDomain): boolean
    replaceObject (oldObj: RefValue, newObj: RefValue): RefValue
    getUndefined (): RefValue
  
    constructProperty (self: RefValue, mn: Multiname, args: Value[]): RefValue
    callProperty (self: RefValue, mn: Multiname, args: Value[]): Value
    isPrototypeOf (self: RefValue, target: RefValue): boolean
  
    setClass (self: RefValue, cls: AXClass): void
    getClass (self: RefValue): AXClass
  
    getProxy (self: RefValue): IProxy
  }
  interface FileInterface {
    readFile (filename: string): Promise<ArrayBuffer>
    writeFile? (filename: string, buffer: ArrayBuffer): Promise<void>
  }
  interface IHookFunction {
    name: string
    callback: Function
  }
  interface ILoggerFlags {
    enableLog: boolean
    enableDebug: boolean
    enableWarn: boolean
    enableError: boolean
  }
  interface ApplicationDomain {}
  interface AXClass {}
  type LogFilter = (tag: string) => boolean
  class FlashEmu {
    constructor (fi: FileInterface)
    fi: FileInterface
    hooks: Map<string, IHookFunction>
    static BUILTIN: string
    static PLAYERGLOBAL: string
    static setLogFilter (f: LogFilter): void
    static setGlobalFlags (flags: ILoggerFlags): void
    init (): Promise<void>
    loadABC (stream: ArrayBuffer, app: ApplicationDomain): void
    loadABCFile (fileName: string, app: ApplicationDomain): Promise<void>
    getPublicClass (name: string): AXClass
    getProperty (pkg: string, name: string): any
    setProperty (pkg: string, name: string, value: any): void
    executeScript (abcid?: number, id?: number): void
    hookFlascc (name: string, espPkg: string, argCount: number, func: (...args: number[]) => any): void
    loadSWF (fileName: string): Promise<void>
    runSWF (fileName: string, executeScript?: boolean): Promise<void>
    getVM (): IValueManager
  }
  export default FlashEmu  
}
