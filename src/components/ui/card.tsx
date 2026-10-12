import * as React from 'react';
import { cn } from '@/lib/utils';
export function Card({className,...props}:React.ComponentProps<'div'>) { return <div className={cn('panel',className)} {...props}/>; }
export function CardHeader(props:React.ComponentProps<'div'>) { return <div {...props}/>; }
export function CardTitle(props:React.ComponentProps<'h3'>) { return <h3 {...props}/>; }
export function CardDescription(props:React.ComponentProps<'p'>) { return <p className="muted" {...props}/>; }
export function CardContent(props:React.ComponentProps<'div'>) { return <div {...props}/>; }
