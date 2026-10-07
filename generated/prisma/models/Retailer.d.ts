import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace.js";
export type RetailerModel = runtime.Types.Result.DefaultSelection<Prisma.$RetailerPayload>;
export type AggregateRetailer = {
    _count: RetailerCountAggregateOutputType | null;
    _min: RetailerMinAggregateOutputType | null;
    _max: RetailerMaxAggregateOutputType | null;
};
export type RetailerMinAggregateOutputType = {
    id: string | null;
    name: string | null;
    website: string | null;
    isActive: boolean | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type RetailerMaxAggregateOutputType = {
    id: string | null;
    name: string | null;
    website: string | null;
    isActive: boolean | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type RetailerCountAggregateOutputType = {
    id: number;
    name: number;
    website: number;
    isActive: number;
    createdAt: number;
    updatedAt: number;
    _all: number;
};
export type RetailerMinAggregateInputType = {
    id?: true;
    name?: true;
    website?: true;
    isActive?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type RetailerMaxAggregateInputType = {
    id?: true;
    name?: true;
    website?: true;
    isActive?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type RetailerCountAggregateInputType = {
    id?: true;
    name?: true;
    website?: true;
    isActive?: true;
    createdAt?: true;
    updatedAt?: true;
    _all?: true;
};
export type RetailerAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.RetailerWhereInput;
    orderBy?: Prisma.RetailerOrderByWithRelationInput | Prisma.RetailerOrderByWithRelationInput[];
    cursor?: Prisma.RetailerWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | RetailerCountAggregateInputType;
    _min?: RetailerMinAggregateInputType;
    _max?: RetailerMaxAggregateInputType;
};
export type GetRetailerAggregateType<T extends RetailerAggregateArgs> = {
    [P in keyof T & keyof AggregateRetailer]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateRetailer[P]> : Prisma.GetScalarType<T[P], AggregateRetailer[P]>;
};
export type RetailerGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.RetailerWhereInput;
    orderBy?: Prisma.RetailerOrderByWithAggregationInput | Prisma.RetailerOrderByWithAggregationInput[];
    by: Prisma.RetailerScalarFieldEnum[] | Prisma.RetailerScalarFieldEnum;
    having?: Prisma.RetailerScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: RetailerCountAggregateInputType | true;
    _min?: RetailerMinAggregateInputType;
    _max?: RetailerMaxAggregateInputType;
};
export type RetailerGroupByOutputType = {
    id: string;
    name: string;
    website: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    _count: RetailerCountAggregateOutputType | null;
    _min: RetailerMinAggregateOutputType | null;
    _max: RetailerMaxAggregateOutputType | null;
};
export type GetRetailerGroupByPayload<T extends RetailerGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<RetailerGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof RetailerGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], RetailerGroupByOutputType[P]> : Prisma.GetScalarType<T[P], RetailerGroupByOutputType[P]>;
}>>;
export type RetailerWhereInput = {
    AND?: Prisma.RetailerWhereInput | Prisma.RetailerWhereInput[];
    OR?: Prisma.RetailerWhereInput[];
    NOT?: Prisma.RetailerWhereInput | Prisma.RetailerWhereInput[];
    id?: Prisma.UuidFilter<"Retailer"> | string;
    name?: Prisma.StringFilter<"Retailer"> | string;
    website?: Prisma.StringNullableFilter<"Retailer"> | string | null;
    isActive?: Prisma.BoolFilter<"Retailer"> | boolean;
    createdAt?: Prisma.DateTimeFilter<"Retailer"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"Retailer"> | Date | string;
    stores?: Prisma.StoreListRelationFilter;
};
export type RetailerOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    website?: Prisma.SortOrderInput | Prisma.SortOrder;
    isActive?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    stores?: Prisma.StoreOrderByRelationAggregateInput;
};
export type RetailerWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    name?: string;
    AND?: Prisma.RetailerWhereInput | Prisma.RetailerWhereInput[];
    OR?: Prisma.RetailerWhereInput[];
    NOT?: Prisma.RetailerWhereInput | Prisma.RetailerWhereInput[];
    website?: Prisma.StringNullableFilter<"Retailer"> | string | null;
    isActive?: Prisma.BoolFilter<"Retailer"> | boolean;
    createdAt?: Prisma.DateTimeFilter<"Retailer"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"Retailer"> | Date | string;
    stores?: Prisma.StoreListRelationFilter;
}, "id" | "name">;
export type RetailerOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    website?: Prisma.SortOrderInput | Prisma.SortOrder;
    isActive?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    _count?: Prisma.RetailerCountOrderByAggregateInput;
    _max?: Prisma.RetailerMaxOrderByAggregateInput;
    _min?: Prisma.RetailerMinOrderByAggregateInput;
};
export type RetailerScalarWhereWithAggregatesInput = {
    AND?: Prisma.RetailerScalarWhereWithAggregatesInput | Prisma.RetailerScalarWhereWithAggregatesInput[];
    OR?: Prisma.RetailerScalarWhereWithAggregatesInput[];
    NOT?: Prisma.RetailerScalarWhereWithAggregatesInput | Prisma.RetailerScalarWhereWithAggregatesInput[];
    id?: Prisma.UuidWithAggregatesFilter<"Retailer"> | string;
    name?: Prisma.StringWithAggregatesFilter<"Retailer"> | string;
    website?: Prisma.StringNullableWithAggregatesFilter<"Retailer"> | string | null;
    isActive?: Prisma.BoolWithAggregatesFilter<"Retailer"> | boolean;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"Retailer"> | Date | string;
    updatedAt?: Prisma.DateTimeWithAggregatesFilter<"Retailer"> | Date | string;
};
export type RetailerCreateInput = {
    id?: string;
    name: string;
    website?: string | null;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    stores?: Prisma.StoreCreateNestedManyWithoutRetailerInput;
};
export type RetailerUncheckedCreateInput = {
    id?: string;
    name: string;
    website?: string | null;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    stores?: Prisma.StoreUncheckedCreateNestedManyWithoutRetailerInput;
};
export type RetailerUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    website?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    stores?: Prisma.StoreUpdateManyWithoutRetailerNestedInput;
};
export type RetailerUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    website?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    stores?: Prisma.StoreUncheckedUpdateManyWithoutRetailerNestedInput;
};
export type RetailerCreateManyInput = {
    id?: string;
    name: string;
    website?: string | null;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type RetailerUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    website?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type RetailerUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    website?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type RetailerCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    website?: Prisma.SortOrder;
    isActive?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type RetailerMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    website?: Prisma.SortOrder;
    isActive?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type RetailerMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    website?: Prisma.SortOrder;
    isActive?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type RetailerScalarRelationFilter = {
    is?: Prisma.RetailerWhereInput;
    isNot?: Prisma.RetailerWhereInput;
};
export type RetailerCreateNestedOneWithoutStoresInput = {
    create?: Prisma.XOR<Prisma.RetailerCreateWithoutStoresInput, Prisma.RetailerUncheckedCreateWithoutStoresInput>;
    connectOrCreate?: Prisma.RetailerCreateOrConnectWithoutStoresInput;
    connect?: Prisma.RetailerWhereUniqueInput;
};
export type RetailerUpdateOneRequiredWithoutStoresNestedInput = {
    create?: Prisma.XOR<Prisma.RetailerCreateWithoutStoresInput, Prisma.RetailerUncheckedCreateWithoutStoresInput>;
    connectOrCreate?: Prisma.RetailerCreateOrConnectWithoutStoresInput;
    upsert?: Prisma.RetailerUpsertWithoutStoresInput;
    connect?: Prisma.RetailerWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.RetailerUpdateToOneWithWhereWithoutStoresInput, Prisma.RetailerUpdateWithoutStoresInput>, Prisma.RetailerUncheckedUpdateWithoutStoresInput>;
};
export type RetailerCreateWithoutStoresInput = {
    id?: string;
    name: string;
    website?: string | null;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type RetailerUncheckedCreateWithoutStoresInput = {
    id?: string;
    name: string;
    website?: string | null;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type RetailerCreateOrConnectWithoutStoresInput = {
    where: Prisma.RetailerWhereUniqueInput;
    create: Prisma.XOR<Prisma.RetailerCreateWithoutStoresInput, Prisma.RetailerUncheckedCreateWithoutStoresInput>;
};
export type RetailerUpsertWithoutStoresInput = {
    update: Prisma.XOR<Prisma.RetailerUpdateWithoutStoresInput, Prisma.RetailerUncheckedUpdateWithoutStoresInput>;
    create: Prisma.XOR<Prisma.RetailerCreateWithoutStoresInput, Prisma.RetailerUncheckedCreateWithoutStoresInput>;
    where?: Prisma.RetailerWhereInput;
};
export type RetailerUpdateToOneWithWhereWithoutStoresInput = {
    where?: Prisma.RetailerWhereInput;
    data: Prisma.XOR<Prisma.RetailerUpdateWithoutStoresInput, Prisma.RetailerUncheckedUpdateWithoutStoresInput>;
};
export type RetailerUpdateWithoutStoresInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    website?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type RetailerUncheckedUpdateWithoutStoresInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    website?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type RetailerCountOutputType = {
    stores: number;
};
export type RetailerCountOutputTypeSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    stores?: boolean | RetailerCountOutputTypeCountStoresArgs;
};
export type RetailerCountOutputTypeDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RetailerCountOutputTypeSelect<ExtArgs> | null;
};
export type RetailerCountOutputTypeCountStoresArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.StoreWhereInput;
};
export type RetailerSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    name?: boolean;
    website?: boolean;
    isActive?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    stores?: boolean | Prisma.Retailer$storesArgs<ExtArgs>;
    _count?: boolean | Prisma.RetailerCountOutputTypeDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["retailer"]>;
export type RetailerSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    name?: boolean;
    website?: boolean;
    isActive?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
}, ExtArgs["result"]["retailer"]>;
export type RetailerSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    name?: boolean;
    website?: boolean;
    isActive?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
}, ExtArgs["result"]["retailer"]>;
export type RetailerSelectScalar = {
    id?: boolean;
    name?: boolean;
    website?: boolean;
    isActive?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
};
export type RetailerOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "name" | "website" | "isActive" | "createdAt" | "updatedAt", ExtArgs["result"]["retailer"]>;
export type RetailerInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    stores?: boolean | Prisma.Retailer$storesArgs<ExtArgs>;
    _count?: boolean | Prisma.RetailerCountOutputTypeDefaultArgs<ExtArgs>;
};
export type RetailerIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {};
export type RetailerIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {};
export type $RetailerPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "Retailer";
    objects: {
        stores: Prisma.$StorePayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        name: string;
        website: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }, ExtArgs["result"]["retailer"]>;
    composites: {};
};
export type RetailerGetPayload<S extends boolean | null | undefined | RetailerDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$RetailerPayload, S>;
export type RetailerCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<RetailerFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: RetailerCountAggregateInputType | true;
};
export interface RetailerDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['Retailer'];
        meta: {
            name: 'Retailer';
        };
    };
    findUnique<T extends RetailerFindUniqueArgs>(args: Prisma.SelectSubset<T, RetailerFindUniqueArgs<ExtArgs>>): Prisma.Prisma__RetailerClient<runtime.Types.Result.GetResult<Prisma.$RetailerPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends RetailerFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, RetailerFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__RetailerClient<runtime.Types.Result.GetResult<Prisma.$RetailerPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends RetailerFindFirstArgs>(args?: Prisma.SelectSubset<T, RetailerFindFirstArgs<ExtArgs>>): Prisma.Prisma__RetailerClient<runtime.Types.Result.GetResult<Prisma.$RetailerPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends RetailerFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, RetailerFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__RetailerClient<runtime.Types.Result.GetResult<Prisma.$RetailerPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends RetailerFindManyArgs>(args?: Prisma.SelectSubset<T, RetailerFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$RetailerPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends RetailerCreateArgs>(args: Prisma.SelectSubset<T, RetailerCreateArgs<ExtArgs>>): Prisma.Prisma__RetailerClient<runtime.Types.Result.GetResult<Prisma.$RetailerPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends RetailerCreateManyArgs>(args?: Prisma.SelectSubset<T, RetailerCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends RetailerCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, RetailerCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$RetailerPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends RetailerDeleteArgs>(args: Prisma.SelectSubset<T, RetailerDeleteArgs<ExtArgs>>): Prisma.Prisma__RetailerClient<runtime.Types.Result.GetResult<Prisma.$RetailerPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends RetailerUpdateArgs>(args: Prisma.SelectSubset<T, RetailerUpdateArgs<ExtArgs>>): Prisma.Prisma__RetailerClient<runtime.Types.Result.GetResult<Prisma.$RetailerPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends RetailerDeleteManyArgs>(args?: Prisma.SelectSubset<T, RetailerDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends RetailerUpdateManyArgs>(args: Prisma.SelectSubset<T, RetailerUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends RetailerUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, RetailerUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$RetailerPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends RetailerUpsertArgs>(args: Prisma.SelectSubset<T, RetailerUpsertArgs<ExtArgs>>): Prisma.Prisma__RetailerClient<runtime.Types.Result.GetResult<Prisma.$RetailerPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends RetailerCountArgs>(args?: Prisma.Subset<T, RetailerCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], RetailerCountAggregateOutputType> : number>;
    aggregate<T extends RetailerAggregateArgs>(args: Prisma.Subset<T, RetailerAggregateArgs>): Prisma.PrismaPromise<GetRetailerAggregateType<T>>;
    groupBy<T extends RetailerGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: RetailerGroupByArgs['orderBy'];
    } : {
        orderBy?: RetailerGroupByArgs['orderBy'];
    }, OrderFields extends Prisma.ExcludeUnderscoreKeys<Prisma.Keys<Prisma.MaybeTupleToUnion<T['orderBy']>>>, ByFields extends Prisma.MaybeTupleToUnion<T['by']>, ByValid extends Prisma.Has<ByFields, OrderFields>, HavingFields extends Prisma.GetHavingFields<T['having']>, HavingValid extends Prisma.Has<ByFields, HavingFields>, ByEmpty extends T['by'] extends never[] ? Prisma.True : Prisma.False, InputErrors extends ByEmpty extends Prisma.True ? `Error: "by" must not be empty.` : HavingValid extends Prisma.False ? {
        [P in HavingFields]: P extends ByFields ? never : P extends string ? `Error: Field "${P}" used in "having" needs to be provided in "by".` : [
            Error,
            'Field ',
            P,
            ` in "having" needs to be provided in "by"`
        ];
    }[HavingFields] : 'take' extends Prisma.Keys<T> ? 'orderBy' extends Prisma.Keys<T> ? ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields] : 'Error: If you provide "take", you also need to provide "orderBy"' : 'skip' extends Prisma.Keys<T> ? 'orderBy' extends Prisma.Keys<T> ? ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields] : 'Error: If you provide "skip", you also need to provide "orderBy"' : ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, RetailerGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetRetailerGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: RetailerFieldRefs;
}
export interface Prisma__RetailerClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    stores<T extends Prisma.Retailer$storesArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Retailer$storesArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$StorePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface RetailerFieldRefs {
    readonly id: Prisma.FieldRef<"Retailer", 'String'>;
    readonly name: Prisma.FieldRef<"Retailer", 'String'>;
    readonly website: Prisma.FieldRef<"Retailer", 'String'>;
    readonly isActive: Prisma.FieldRef<"Retailer", 'Boolean'>;
    readonly createdAt: Prisma.FieldRef<"Retailer", 'DateTime'>;
    readonly updatedAt: Prisma.FieldRef<"Retailer", 'DateTime'>;
}
export type RetailerFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RetailerSelect<ExtArgs> | null;
    omit?: Prisma.RetailerOmit<ExtArgs> | null;
    include?: Prisma.RetailerInclude<ExtArgs> | null;
    where: Prisma.RetailerWhereUniqueInput;
};
export type RetailerFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RetailerSelect<ExtArgs> | null;
    omit?: Prisma.RetailerOmit<ExtArgs> | null;
    include?: Prisma.RetailerInclude<ExtArgs> | null;
    where: Prisma.RetailerWhereUniqueInput;
};
export type RetailerFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RetailerSelect<ExtArgs> | null;
    omit?: Prisma.RetailerOmit<ExtArgs> | null;
    include?: Prisma.RetailerInclude<ExtArgs> | null;
    where?: Prisma.RetailerWhereInput;
    orderBy?: Prisma.RetailerOrderByWithRelationInput | Prisma.RetailerOrderByWithRelationInput[];
    cursor?: Prisma.RetailerWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.RetailerScalarFieldEnum | Prisma.RetailerScalarFieldEnum[];
};
export type RetailerFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RetailerSelect<ExtArgs> | null;
    omit?: Prisma.RetailerOmit<ExtArgs> | null;
    include?: Prisma.RetailerInclude<ExtArgs> | null;
    where?: Prisma.RetailerWhereInput;
    orderBy?: Prisma.RetailerOrderByWithRelationInput | Prisma.RetailerOrderByWithRelationInput[];
    cursor?: Prisma.RetailerWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.RetailerScalarFieldEnum | Prisma.RetailerScalarFieldEnum[];
};
export type RetailerFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RetailerSelect<ExtArgs> | null;
    omit?: Prisma.RetailerOmit<ExtArgs> | null;
    include?: Prisma.RetailerInclude<ExtArgs> | null;
    where?: Prisma.RetailerWhereInput;
    orderBy?: Prisma.RetailerOrderByWithRelationInput | Prisma.RetailerOrderByWithRelationInput[];
    cursor?: Prisma.RetailerWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.RetailerScalarFieldEnum | Prisma.RetailerScalarFieldEnum[];
};
export type RetailerCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RetailerSelect<ExtArgs> | null;
    omit?: Prisma.RetailerOmit<ExtArgs> | null;
    include?: Prisma.RetailerInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.RetailerCreateInput, Prisma.RetailerUncheckedCreateInput>;
};
export type RetailerCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.RetailerCreateManyInput | Prisma.RetailerCreateManyInput[];
    skipDuplicates?: boolean;
};
export type RetailerCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RetailerSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.RetailerOmit<ExtArgs> | null;
    data: Prisma.RetailerCreateManyInput | Prisma.RetailerCreateManyInput[];
    skipDuplicates?: boolean;
};
export type RetailerUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RetailerSelect<ExtArgs> | null;
    omit?: Prisma.RetailerOmit<ExtArgs> | null;
    include?: Prisma.RetailerInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.RetailerUpdateInput, Prisma.RetailerUncheckedUpdateInput>;
    where: Prisma.RetailerWhereUniqueInput;
};
export type RetailerUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.RetailerUpdateManyMutationInput, Prisma.RetailerUncheckedUpdateManyInput>;
    where?: Prisma.RetailerWhereInput;
    limit?: number;
};
export type RetailerUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RetailerSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.RetailerOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.RetailerUpdateManyMutationInput, Prisma.RetailerUncheckedUpdateManyInput>;
    where?: Prisma.RetailerWhereInput;
    limit?: number;
};
export type RetailerUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RetailerSelect<ExtArgs> | null;
    omit?: Prisma.RetailerOmit<ExtArgs> | null;
    include?: Prisma.RetailerInclude<ExtArgs> | null;
    where: Prisma.RetailerWhereUniqueInput;
    create: Prisma.XOR<Prisma.RetailerCreateInput, Prisma.RetailerUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.RetailerUpdateInput, Prisma.RetailerUncheckedUpdateInput>;
};
export type RetailerDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RetailerSelect<ExtArgs> | null;
    omit?: Prisma.RetailerOmit<ExtArgs> | null;
    include?: Prisma.RetailerInclude<ExtArgs> | null;
    where: Prisma.RetailerWhereUniqueInput;
};
export type RetailerDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.RetailerWhereInput;
    limit?: number;
};
export type Retailer$storesArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.StoreSelect<ExtArgs> | null;
    omit?: Prisma.StoreOmit<ExtArgs> | null;
    include?: Prisma.StoreInclude<ExtArgs> | null;
    where?: Prisma.StoreWhereInput;
    orderBy?: Prisma.StoreOrderByWithRelationInput | Prisma.StoreOrderByWithRelationInput[];
    cursor?: Prisma.StoreWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.StoreScalarFieldEnum | Prisma.StoreScalarFieldEnum[];
};
export type RetailerDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RetailerSelect<ExtArgs> | null;
    omit?: Prisma.RetailerOmit<ExtArgs> | null;
    include?: Prisma.RetailerInclude<ExtArgs> | null;
};
